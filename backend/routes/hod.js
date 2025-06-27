const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const sql = require('../config/neonsetup');
const Hod = require('../models/Hod');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Get HOD dashboard data (real-time, structured)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const departmentId = req.user.departmentId;

    // Get HOD profile
    const [hod] = await sql`
      SELECT id, erpid, name, email, department_id, start_date, end_date, is_active
      FROM hod
      WHERE id = ${userId}
    `;
    if (!hod) return res.status(404).json({ message: 'HOD not found' });

    // Get department name
    let departmentName = null;
    try {
      const deptResult = await sql`
        SELECT name FROM departments WHERE id = ${hod.department_id}
      `;
      if (deptResult && deptResult.length > 0) departmentName = deptResult[0].name;
    } catch {}

    // Get department stats
    const [deptStats = {}] = await sql`
      SELECT
        (SELECT COUNT(*) FROM students WHERE department_id = ${departmentId}) AS "totalStudents",
        (SELECT COUNT(*) FROM faculty WHERE department_id = ${departmentId} AND is_active = true) AS "totalFaculty"
    `;

    // Get faculty list
    const faculty = await sql`
      SELECT id, erpid, name, email, is_active, created_at FROM faculty WHERE department_id = ${departmentId} AND is_active = true ORDER BY name ASC
    `;

    // Get non-teaching staff
    const nonTeachingStaff = await sql`
      SELECT id, erpid, name, email FROM non_teaching_staff WHERE department_id = ${departmentId} ORDER BY name ASC
    `;

    // Get attendance logs count
    const [{ count: attendanceLogsCount }] = await sql`
      SELECT COUNT(*)::int as count FROM faculty_logs fl JOIN faculty f ON fl.erp_id = f.erpid WHERE f.department_id = ${departmentId}
    `;

    // Get stress levels (faculty)
    const stressRows = await sql`
      SELECT stress_status FROM stress_logs sl JOIN faculty f ON sl.erpid = f.erpid WHERE f.department_id = ${departmentId}
    `;
    let facultyStress = { high: 0, medium: 0, low: 0 };
    stressRows.forEach(row => {
      if (["Stressed", "At Risk", "Critical", "Warning"].includes(row.stress_status)) facultyStress.high++;
      else if (["Stable", "Normal"].includes(row.stress_status)) facultyStress.low++;
      else facultyStress.medium++;
    });

    // Get all faculty logs for the department
    const logs = await sql`
      SELECT fl.*, f.name as person_name
      FROM faculty_logs fl
      JOIN faculty f ON fl.erp_id = f.erpid
      WHERE f.department_id = ${departmentId}
      ORDER BY fl.timestamp DESC
    `;

    // Compose response
    const dashboard = {
      name: hod.name,
      hodErpId: hod.erpid,
      email: hod.email,
      department: departmentName || `Department ID: ${hod.department_id}`,
      departmentStats: {
        totalStudents: deptStats.totalStudents || 0,
        totalFaculty: deptStats.totalFaculty || 0,
        ongoingProjects: 0,
        avgAttendance: 0 // Placeholder, can be calculated if needed
      },
      faculty: faculty,
      nonTeachingStaff: nonTeachingStaff,
      attendanceLogsCount: attendanceLogsCount || 0,
      stressLevels: {
        faculty: facultyStress
      },
      logs: logs
    };
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching HOD dashboard:', error);
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

// Faculty attendance report for HOD (CSV, XLSX, PDF)
router.get('/faculty-attendance-report', authenticateToken, async (req, res) => {
  try {
    const { faculty, from, to, format } = req.query;
    const departmentId = req.user.departmentId;
    const fromDate = from || '1900-01-01';
    const toDate = to || '2100-12-31';
    let records;
    if (faculty && faculty !== 'all') {
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          log_summary.attendance_date,
          log_summary.first_log,
          log_summary.last_log
        FROM
          (
            SELECT
              erp_id,
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
              MIN(timestamp) AS first_log,
              MAX(timestamp) AS last_log
            FROM
              faculty_logs
            WHERE
              erp_id = ${faculty}
              AND DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${fromDate}::date
              AND DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${toDate}::date
            GROUP BY
              erp_id,
              attendance_date
          ) AS log_summary
        JOIN
          faculty f ON log_summary.erp_id = f.erpid
        JOIN
          departments d ON f.department_id = d.id
        WHERE f.department_id = ${departmentId}
        ORDER BY d.name, f.name, log_summary.attendance_date
      `;
    } else {
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          log_summary.attendance_date,
          log_summary.first_log,
          log_summary.last_log
        FROM
          (
            SELECT
              erp_id,
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
              MIN(timestamp) AS first_log,
              MAX(timestamp) AS last_log
            FROM
              faculty_logs
            WHERE
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${fromDate}::date
              AND DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${toDate}::date
            GROUP BY
              erp_id,
              attendance_date
          ) AS log_summary
        JOIN
          faculty f ON log_summary.erp_id = f.erpid
        JOIN
          departments d ON f.department_id = d.id
        WHERE f.department_id = ${departmentId}
        ORDER BY d.name, f.name, log_summary.attendance_date
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No attendance data found for the selected criteria.');
    }
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_attendance.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Faculty Attendance Report', { align: 'center' });
      doc.moveDown();
      const headers = ['Date', 'Faculty Name', 'ERP ID', 'Department', 'First Log', 'Last Log', 'Duration (HH:MM:SS)', 'Half/Full Day'];
      const colWidths = [80, 140, 70, 160, 70, 70, 120, 90];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], 20).stroke();
          doc.text(header, x + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });
        y += 20;
        doc.font('Helvetica').fontSize(9);
        doc.y = y;
      }
      drawHeader();
      function toISTDateString(utcDateString) {
        const date = new Date(utcDateString);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);
        return istDate.toISOString().split('T')[0];
      }
      let rowCount = 0;
      rows.forEach(r => {
        const firstLog = new Date(r.first_log);
        const lastLog = new Date(r.last_log);
        let duration = '00:00:00';
        let durationHours = 0;
        const durationMs = lastLog - firstLog;
        if (!isNaN(durationMs) && durationMs >= 0) {
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
          const seconds = Math.floor((durationMs / 1000) % 60);
          duration = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          durationHours = durationMs / (1000 * 60 * 60);
        }
        const halfFull = durationHours < 4 ? 'Half Day' : 'Full Day';
        const row = [
          toISTDateString(r.first_log),
          r.faculty_name,
          r.erpid,
          r.department_name,
          firstLog.toTimeString().split(' ')[0],
          lastLog.toTimeString().split(' ')[0],
          duration,
          halfFull
        ];
        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        if (rowCount % 25 === 0) {
          doc.addPage();
          y = doc.y;
          drawHeader();
          y = doc.y;
        }
      });
      doc.end();
      return;
    }
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Faculty Attendance');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Faculty Name', key: 'faculty_name', width: 25 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Department', key: 'department_name', width: 25 },
        { header: 'First Log', key: 'first_log', width: 15 },
        { header: 'Last Log', key: 'last_log', width: 15 },
        { header: 'Duration (HH:MM:SS)', key: 'duration', width: 18 },
        { header: 'Half/Full Day', key: 'half_full', width: 15 },
      ];
      function toISTDateString(utcDateString) {
        const date = new Date(utcDateString);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);
        return istDate.toISOString().split('T')[0];
      }
      rows.forEach(r => {
        const firstLog = new Date(r.first_log);
        const lastLog = new Date(r.last_log);
        let duration = '00:00:00';
        let durationHours = 0;
        const durationMs = lastLog - firstLog;
        if (!isNaN(durationMs) && durationMs >= 0) {
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
          const seconds = Math.floor((durationMs / 1000) % 60);
          duration = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          durationHours = durationMs / (1000 * 60 * 60);
        }
        const halfFull = durationHours < 4 ? 'Half Day' : 'Full Day';
        worksheet.addRow({
          date: toISTDateString(r.first_log),
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          department_name: r.department_name,
          first_log: firstLog.toTimeString().split(' ')[0],
          last_log: lastLog.toTimeString().split(' ')[0],
          duration,
          half_full: halfFull,
        });
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_attendance.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV generation
    function toISTDateString(utcDateString) {
      const date = new Date(utcDateString);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(date.getTime() + istOffset);
      return istDate.toISOString().split('T')[0];
    }
    const csvHeader = 'Date,Faculty Name,ERP ID,Department,First Log,Last Log,Duration (HH:MM:SS),Half/Full Day\n';
    const csvRows = rows.map(r => {
      const firstLog = new Date(r.first_log);
      const lastLog = new Date(r.last_log);
      let duration = '00:00:00';
      let durationHours = 0;
      const durationMs = lastLog - firstLog;
      if (!isNaN(durationMs) && durationMs >= 0) {
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const seconds = Math.floor((durationMs / 1000) % 60);
        duration = `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        durationHours = durationMs / (1000 * 60 * 60);
      }
      const halfFull = durationHours < 4 ? 'Half Day' : 'Full Day';
      return [
        toISTDateString(r.first_log),
        `"${r.faculty_name}"`,
        r.erpid,
        `"${r.department_name}"`,
        firstLog.toTimeString().split(' ')[0],
        lastLog.toTimeString().split(' ')[0],
        duration,
        halfFull
      ].join(',');
    });
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('faculty_attendance.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: 'Failed to generate attendance report' });
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
    // Get all logs (no LIMIT)
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${faculty.erpid} ORDER BY timestamp DESC
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
    // Get all logs (no LIMIT)
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${staff.erpid} ORDER BY timestamp DESC
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