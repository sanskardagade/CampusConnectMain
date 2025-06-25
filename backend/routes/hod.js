const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const sql = require('../config/neonsetup');
const Hod = require('../models/Hod');
const { generateReport } = require('../services/reportService.jsx');

// Get HOD profile
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching HOD profile for user:', req.user);

    // First get the HOD data
    const result = await sql`
      SELECT id, erpid, name, email, department_id, start_date, end_date, is_active
      FROM hod
      WHERE id = ${req.user.id}
    `;

    console.log('Query result:', result);

    if (!result || result.length === 0) {
      console.log('No HOD found for id:', req.user.id);
      return res.status(404).json({ message: 'HOD not found' });
    }

    const hod = result[0];

    // Try to get department name if department table exists
    let departmentName = null;
    try {
      const deptResult = await sql`
        SELECT name 
        FROM departments
        WHERE id = ${hod.department_id}
      `;
      if (deptResult && deptResult.length > 0) {
        departmentName = deptResult[0].name;
      }
    } catch (deptError) {
      console.log('Department table not found or error:', deptError);
      // Continue without department name
    }

    const response = {
      id: hod.id,
      erpStaffId: hod.erpid,
      name: hod.name,
      email: hod.email,
      department: departmentName || 'Department ID: ' + hod.department_id,
      startDate: hod.start_date,
      endDate: hod.end_date,
      isActive: hod.is_active
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching HOD profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all HODs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const hods = await Hod.getAll();
    res.json(hods);
  } catch (error) {
    console.error('Error fetching HODs:', error);
    res.status(500).json({ message: 'Error fetching HOD data' });
  }
});

// Get HOD by department
router.get('/department/:department', authenticateToken, async (req, res) => {
  try {
    const { department } = req.params;
    const hod = await Hod.getByDepartment(department);
    res.json(hod);
  } catch (error) {
    console.error('Error fetching HOD by department:', error);
    res.status(500).json({ message: 'Error fetching HOD data' });
  }
});

// Change password route
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const erpStaffId = req.user.erpStaffId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get HOD from database
    const hod = await Hod.findByErpStaffId(erpStaffId);
    if (!hod) {
      return res.status(404).json({ message: 'HOD not found' });
    }

    // Verify current password
    const isPasswordValid = await Hod.comparePassword(currentPassword, hod.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password in database
    const updated = await Hod.updatePassword(erpStaffId, newPassword);
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in change password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Get faculty members by department
router.get('/faculty', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    console.log('Fetching faculty for department ID:', departmentId);
    console.log('User data:', req.user);
    
    const result = await sql`
      SELECT 
        f.id,
        f.erpid,
        f.name,
        f.email,
        f.department_id,
        f.is_active,
        f.created_at,
        f.updated_at,
        d.name as department_name
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      WHERE f.department_id = ${departmentId}
      AND f.is_active = true
      ORDER BY f.name ASC
    `;

    res.json(result);
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    res.status(500).json({ message: 'Error fetching faculty members' });
  }
});

// Update HOD profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const id = req.user.id;
    const result = await sql`
      UPDATE hod
      SET name = ${name}, email = ${email}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, erpid, name, email, department_id, start_date, end_date, is_active
    `;
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'HOD not found' });
    }
    const hod = result[0];
    // Try to get department name if department table exists
    let departmentName = null;
    try {
      const deptResult = await sql`
        SELECT name FROM department WHERE id = ${hod.department_id}
      `;
      if (deptResult && deptResult.length > 0) {
        departmentName = deptResult[0].name;
      }
    } catch (deptError) {
      // Continue without department name
    }
    const response = {
      id: hod.id,
      erpStaffId: hod.erpid,
      name: hod.name,
      email: hod.email,
      department: departmentName || 'Department ID: ' + hod.department_id,
      startDate: hod.start_date,
      endDate: hod.end_date,
      isActive: hod.is_active
    };
    res.json(response);
  } catch (error) {
    console.error('Error updating HOD profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/faculty-log', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    console.log('Fetching faculty for department ID:', departmentId);
    console.log('User data:', req.user);

    //fetching faculty logs
    const rows = await sql`
      SELECT fl.*
      FROM faculty_logs fl
      JOIN faculty f ON fl.erp_id = f.erpid
      WHERE f.department_id = ${departmentId}
    `;

    //fetching faculties from department table with help of department id
    const result = await sql`
      SELECT 
        f.id,
        f.erpid,
        f.name,
        f.email,
        f.department_id,
        f.is_active,
        f.created_at,
        f.updated_at,
        d.name as department_name
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      WHERE f.department_id = ${departmentId}
      AND f.is_active = true
      ORDER BY f.name ASC
    `;
    res.json({ logs: rows, faculty: result });
  } catch (error) {
    console.error("Error fetching faculty log:", error);
    res.status(500).json({ message: "Error fetching faculty log" });
  }
});

//HOD Leave Approval
router.get('/leave-approval', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_leave
      WHERE "HodApproval" = 'Pending'
    `;
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Detailed error in /leave-approval route:", error);
    res.status(500).json({ message: "Error fetching all leave applications" });
  }
});

router.put('/leave-approval/:erpStaffId', async (req, res) => {
  const { erpStaffId } = req.params;
  const { HodApproval } = req.body;

  try {
    // Validate the approval status
    if (!['Approved', 'Rejected'].includes(HodApproval)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    if (HodApproval === 'Rejected') {
      // If rejected, update all status fields to Rejected
      await sql`
        UPDATE faculty_leave 
        SET "HodApproval" = ${HodApproval},
            "PrincipalApproval" = 'Rejected',
            "FinalStatus" = 'Rejected'
        WHERE "ErpStaffId" = ${erpStaffId}
      `;
    } else {
      // If approved, only update HOD approval
      await sql`
        UPDATE faculty_leave 
        SET "HodApproval" = ${HodApproval}
        WHERE "ErpStaffId" = ${erpStaffId}
      `;
    }
    res.json({ message: 'Leave approval updated successfully' });
  } catch (error) {
    console.error('Error updating leave approval:', error);
    res.status(500).json({ error: 'Error updating leave approval' });
  }
});

// Report generation endpoint
router.get('/faculty-attendance-report', authenticateToken, async (req, res) => {
  try {
    const { faculty, from, to, format } = req.query;
    const departmentId = req.user.departmentId;
    let logs;
    if (faculty && faculty !== 'all') {
      logs = await sql`
        SELECT f.name, f.erpid, fl.classroom, fl.timestamp
        FROM faculty_logs fl
        JOIN faculty f ON fl.erp_id = f.erpid
        WHERE f.department_id = ${departmentId}
          AND f.erpid = ${faculty}
          AND fl.timestamp >= ${from || '1970-01-01'}
          AND fl.timestamp <= ${to || '2100-01-01'}
        ORDER BY fl.timestamp DESC
      `;
      if (!logs || logs.length === 0) return res.status(404).send('No attendance data found for the selected criteria.');
      // Group by classroom and date
      const grouped = {};
      logs.forEach(row => {
        const date = row.timestamp ? new Date(row.timestamp).toLocaleDateString() : '';
        const time = row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '';
        const key = `${date}|${row.classroom}`;
        if (!grouped[key]) grouped[key] = { Date: date, Time: time, Classroom: row.classroom, 'Logs Number': 0, 'ERP ID': row.erpid };
        grouped[key]['Logs Number']++;
      });
      const data = Object.values(grouped);
      // For PDF, pass faculty name as title
      const facultyName = logs[0].name;
      const { buffer, filename, contentType } = await generateReport(data, format || 'xlsx', facultyName);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } else {
      logs = await sql`
        SELECT f.name, f.erpid, fl.classroom, fl.timestamp
        FROM faculty_logs fl
        JOIN faculty f ON fl.erp_id = f.erpid
        WHERE f.department_id = ${departmentId}
          AND fl.timestamp >= ${from || '1970-01-01'}
          AND fl.timestamp <= ${to || '2100-01-01'}
        ORDER BY f.name, fl.timestamp DESC
      `;
      if (!logs || logs.length === 0) return res.status(404).send('No attendance data found for the selected criteria.');
      // Group logs by faculty
      const facultyMap = new Map();
      logs.forEach(row => {
        const key = row.erpid;
        if (!facultyMap.has(key)) {
          facultyMap.set(key, { Name: row.name, 'ERP ID': row.erpid, 'Logs Number': 0 });
        }
        facultyMap.get(key)['Logs Number']++;
      });
      const data = Array.from(facultyMap.values());
      const { buffer, filename, contentType } = await generateReport(data, format || 'xlsx');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});


router.get('/faculty-stress-report', authenticateToken, async (req, res) => {
  try {
    const { faculty, from, to, format } = req.query;
    let logs;
    let sqlQuery;
    if (faculty && faculty !== 'all') {
      sqlQuery = sql`
        SELECT f.name, f.erpid, sl.stress_status, sl.timestamp
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        WHERE f.erpid = ${faculty}
          AND sl.timestamp >= ${from || '1970-01-01'}
          AND sl.timestamp <= ${to || '2100-01-01'}
        ORDER BY sl.timestamp DESC
      `;
    } else {
      sqlQuery = sql`
        SELECT f.name, f.erpid, sl.stress_status, sl.timestamp
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        WHERE sl.timestamp >= ${from || '1970-01-01'}
          AND sl.timestamp <= ${to || '2100-01-01'}
        ORDER BY f.name, sl.timestamp DESC
      `;
    }
    logs = await sqlQuery;
    console.log('Faculty Stress Logs:', logs);

    if (!logs || logs.length === 0) {
      if (format === 'pdf' || format === 'xlsx' || format === 'csv' || format === 'docx') {
        let data = [];
        if (faculty && faculty !== 'all') {
          data = [{ 'ERP ID': '', Name: '', Date: '', Time: '', Status: '' }];
        } else {
          data = [{ 'ERP ID': '', Name: '', 'Stress Count': 0, 'Unstress Count': 0 }];
        }
        const { buffer, filename, contentType } = await generateReport(data, format || 'xlsx', 'No Data Found');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        return res.send(buffer);
      } else {
        return res.status(200).json({ message: 'No stress data found for the selected criteria.', data: [] });
      }
    }

    if (faculty && faculty !== 'all') {
      const data = logs.map(row => ({
        'ERP ID': row.erpid,
        Name: row.name,
        Date: row.timestamp ? new Date(row.timestamp).toLocaleDateString() : '',
        Time: row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '',
        Status: row.stress_status
      }));
      const facultyName = logs[0].name;
      const { buffer, filename, contentType } = await generateReport(data, format || 'xlsx', facultyName + ' Stress Report');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } else {
      const facultyMap = new Map();
      logs.forEach(row => {
        const key = row.erpid;
        if (!facultyMap.has(key)) {
          facultyMap.set(key, { 'ERP ID': row.erpid, Name: row.name, 'Stress Count': 0, 'Unstress Count': 0 });
        }
        if ([
          'Stressed','At Risk','Critical','Warning'
        ].includes(row.stress_status)) {
          facultyMap.get(key)['Stress Count']++;
        } else if ([
          'Stable','Normal'
        ].includes(row.stress_status)) {
          facultyMap.get(key)['Unstress Count']++;
        }
      });
      const data = Array.from(facultyMap.values());
      const { buffer, filename, contentType } = await generateReport(data, format || 'xlsx', 'Faculty Stress Report');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error generating stress report:', error);
    res.status(500).json({ message: 'Failed to generate stress report', error: error.message });
  }
});

// Get non-teaching staff by department
router.get('/nonteaching', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const staff = await sql`
      SELECT id, erpid, name, email, department_id
      FROM non_teaching_staff
      WHERE department_id = ${departmentId}
      ORDER BY name ASC
    `;
    res.json(staff);
  } catch (error) {
    console.error('Error fetching non-teaching staff:', error);
    res.status(500).json({ message: 'Error fetching non-teaching staff' });
  }
});

// Get faculty profile and logs by ID (for HOD)
router.get('/faculty-profile/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const departmentId = req.user.departmentId;
    // Get faculty profile
    const [faculty] = await sql`
      SELECT id, erpid, name, email, department_id, is_active, created_at
      FROM faculty
      WHERE id = ${id} AND department_id = ${departmentId}
    `;
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    // Get recent logs
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${faculty.erpid} ORDER BY timestamp DESC LIMIT 20
    `;
    res.json({ profile: faculty, logs });
  } catch (error) {
    console.error('Error fetching faculty profile/logs:', error);
    res.status(500).json({ message: 'Error fetching faculty profile/logs' });
  }
});

// Get non-teaching staff profile and logs by ID (for HOD)
router.get('/staff-profile/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const departmentId = req.user.departmentId;
    // Get staff profile
    const [staff] = await sql`
      SELECT id, erpid, name, email, department_id, created_at
      FROM non_teaching_staff
      WHERE id = ${id} AND department_id = ${departmentId}
    `;
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    // Get recent logs (if any, using erpid)
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${staff.erpid} ORDER BY timestamp DESC LIMIT 20
    `;
    res.json({ profile: staff, logs });
  } catch (error) {
    console.error('Error fetching staff profile/logs:', error);
    res.status(500).json({ message: 'Error fetching staff profile/logs' });
  }
});

// Get 5 most recent faculty logs for the HOD's department
router.get('/recent-faculty-logs', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const logs = await sql`
      SELECT fl.*, f.name as person_name, f.id as faculty_id
      FROM faculty_logs fl
      JOIN faculty f ON fl.erp_id = f.erpid
      WHERE f.department_id = ${departmentId}
      ORDER BY fl.timestamp DESC
      LIMIT 5
    `;
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent faculty logs:', error);
    res.status(500).json({ message: 'Error fetching recent faculty logs' });
  }
});

module.exports = router; 