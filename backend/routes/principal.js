const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const sql = require('../config/neonsetup');
const PrincipalModel = require('../models/Principal.js');
const { verifyPrincipal } = require('../middleware/roleVerification');
const PDFDocument = require('pdfkit');

// Protect all principal routes
router.use(authenticateToken);
router.use(verifyPrincipal);

// route to get all members
router.get('/all-members', authenticateToken, verifyPrincipal, async (req, res) => {
  try {
    // Get all members across all departments and types
    const [students, faculty, staff] = await Promise.all([
      sql`SELECT id, erpid, name, email, 'students' AS type FROM students`,
      sql`SELECT id, erpid, name, email, 'faculty' AS type FROM faculty WHERE is_active = true`,
      sql`SELECT id, erpid, name, email, 'staff' AS type FROM non_teaching_staff`
    ]);

    const allMembers = [...students, ...faculty, ...staff];
    res.json({ members: allMembers });
  } catch (error) {
    console.error('Error fetching all members:', error);
    res.status(500).json({ error: 'Failed to fetch all members' });
  }
});

// Principal Profile Routes
router.get('/profile', async (req, res) => {
  try {
    console.log('Fetching Principal profile for:', req.user.id);

    const [principal] = await sql`
      SELECT 
        id, 
        erpid AS erpStaffId, 
        name, 
        email, 
        start_date AS startDate, 
        end_date AS endDate, 
        is_active AS isActive
      FROM principal
      WHERE erpid = ${req.user.id}
    `;

    if (!principal) {
      console.log('Principal not found');
      return res.status(404).json({ message: 'Principal not found' });
    }

    console.log('Profile fetched successfully');
    res.json(principal);

  } catch (error) {
    console.error('Profile fetch error:', error);
    const status = error.code === '42P01' ? 404 : 500;
    const message = error.code === '42P01' 
      ? 'Principal table not found' 
      : 'Failed to fetch profile';
    res.status(status).json({ message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log('Updating profile for:', req.user.id);

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const [updatedPrincipal] = await sql`
      UPDATE principal
      SET 
        name = ${name},
        email = ${email},
        updated_at = NOW()
      WHERE erpid = ${req.user.id}
      RETURNING 
        id, 
        erpid AS erpStaffId, 
        name, 
        email, 
        start_date AS startDate, 
        end_date AS endDate, 
        is_active AS isActive
    `;

    if (!updatedPrincipal) {
      return res.status(404).json({ message: 'Principal not found' });
    }

    console.log('Profile updated successfully');
    res.json(updatedPrincipal);

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Dashboard Data Routes
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Fetching dashboard data for principal');

    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM departments) AS departments,
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM faculty WHERE is_active = true) AS faculty,
        (SELECT COUNT(*) FROM non_teaching_staff) AS staff
    `;

    const departments = await sql`
      SELECT id, name, short_code AS code
      FROM departments
      ORDER BY name
    `;

    res.json({ stats, departments });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

router.get('/faculty', async (req, res) => {
  try {
    console.log('Fetching faculty data');

    const faculty = await sql`
      SELECT
        f.id,
        f.erpid,
        f.name,
        f.email,
        f.is_active,
        d.id AS department_id,
        d.name AS department_name
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      ORDER BY d.name, f.name
    `;

    if (!faculty.length) {
      return res.status(404).json({ message: 'No faculty found' });
    }

    // Group by department
    const departmentsMap = faculty.reduce((acc, member) => {
      const dept = acc[member.department_name] || {
        department_id: member.department_id,
        department_name: member.department_name,
        faculty: []
      };
      dept.faculty.push({
        id: member.id,
        erpStaffId: member.erpid,
        name: member.name,
        email: member.email,
        isActive: member.is_active
      });
      acc[member.department_name] = dept;
      return acc;
    }, {});

    res.json({ departments: Object.values(departmentsMap) });

  } catch (error) {
    console.error('Faculty data error:', error);
    res.status(500).json({ message: 'Failed to fetch faculty data' });
  }
});

// Member Management
router.get('/members', async (req, res) => {
  try {
    const { deptId, type } = req.query;
    console.log(`Fetching ${type} members for department ${deptId}`);

    if (!deptId || !type) {
      return res.status(400).json({ message: 'Department ID and type are required' });
    }

    let query;
    switch (type) {
      case 'students':
        query = sql`
          SELECT id, erpid, name, email
          FROM students
          WHERE department_id = ${deptId}
          ORDER BY name
        `;
        break;
      case 'faculty':
        query = sql`
          SELECT id, erpid, name, email
          FROM faculty
          WHERE department_id = ${deptId} AND is_active = true
          ORDER BY name
        `;
        break;
      case 'staff':
        query = sql`
          SELECT id, erpid, name, email
          FROM non_teaching_staff
          WHERE department_id = ${deptId}
          ORDER BY name
        `;
        break;
      default:
        return res.status(400).json({ message: 'Invalid member type' });
    }

    const members = await query;
    res.json({ members });

  } catch (error) {
    console.error('Members fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    console.log(`Fetching ${type} profile for ID ${id}`);

    if (!type) {
      return res.status(400).json({ message: 'Member type is required' });
    }

    let profile, extraData = {};

    switch (type) {
      case 'students':
        [profile] = await sql`
          SELECT
            s.id, s.erpid, s.name, s.email, s.contact_no AS phone,
            s.dob, s.year, s.division, s.roll_no,
            d.name AS department
          FROM students s
          JOIN departments d ON s.department_id = d.id
          WHERE s.id = ${id}
        `;
        break;

      case 'faculty':
        [[profile], [logs, stress]] = await Promise.all([
          sql`
            SELECT
              f.id, f.erpid, f.name, f.email,
              d.name AS department
            FROM faculty f
            JOIN departments d ON f.department_id = d.id
            WHERE f.id = ${id}
          `,
          Promise.all([
            sql`
              SELECT
                classroom,
                timestamp AS date,
                COALESCE(NULLIF(person_name, ''), 'Unknown') AS status
              FROM faculty_logs
              WHERE erp_id = (SELECT erpid FROM faculty WHERE id = ${id})
              ORDER BY timestamp DESC
              LIMIT 10
            `,
            sql`
              SELECT
                stress_status AS level
              FROM stress_logs
              WHERE erpid = (SELECT erpid FROM faculty WHERE id = ${id})
              ORDER BY timestamp DESC
              LIMIT 1
            `
          ])
        ]);

        extraData = {
          attendance: {
            recent: logs.map(log => ({
              date: log.date.toISOString().split('T')[0],
              status: log.status,
              classroom: log.classroom
            })),
            percentage: calculateAttendancePercentage(logs)
          },
          stressLevel: stress[0]?.level || 'Normal'
        };
        break;

      case 'staff':
        [profile] = await sql`
          SELECT
            id, erpid, name, email,
            (SELECT name FROM departments WHERE id = department_id) AS department
          FROM non_teaching_staff
          WHERE id = ${id}
        `;
        break;

      default:
        return res.status(400).json({ message: 'Invalid member type' });
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ ...profile, ...extraData });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Password Management
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('Password change request for:', req.user.id);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }

    const principal = await PrincipalModel.findByErp(req.user.id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal not found' });
    }

    const isValid = await PrincipalModel.comparePassword(currentPassword, principal.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password in database
    const updated = await PrincipalModel.updatePassword(req.user.id, newPassword);
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Helper function
function calculateAttendancePercentage(logs) {
  if (!logs?.length) return 0;
  const present = logs.filter(log => log.status !== 'Unknown').length;
  return Math.round((present / logs.length) * 100);
}

// Add this route after other principal routes
router.get('/faculty-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get ERP ID for the faculty
    const [faculty] = await sql`
      SELECT erpid FROM faculty WHERE id = ${id}
    `;
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    // Get all logs for this faculty
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${faculty.erpid} ORDER BY timestamp DESC
    `;
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching faculty logs:', error);
    res.status(500).json({ message: 'Failed to fetch faculty logs' });
  }
});

// Add this route for staff logs
router.get('/staff-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get ERP ID for the staff
    const [staff] = await sql`
      SELECT erpid FROM non_teaching_staff WHERE id = ${id}
    `;
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    // Get all logs for this staff from the 'faculty_logs' table
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${staff.erpid} ORDER BY timestamp DESC
    `;
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching staff logs:', error);
    res.status(500).json({ message: 'Failed to fetch staff logs' });
  }
});

router.get('/faculty-attendance-report', async (req, res) => {
  try {
      const { departmentId, fromDate, toDate, format } = req.query;
      console.log('Requested attendance report format:', format);

      // Set default values to avoid undefined parameter errors
      const from = fromDate || '1900-01-01';
      const to = toDate || '2100-12-31';

      let records;
      if (departmentId && departmentId !== 'all') {
        let deptIds;
        if (departmentId.includes(',')) {
          deptIds = departmentId.split(',').map(id => Number(id));
        } else {
          deptIds = [Number(departmentId)];
        }
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
                        DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date AND
                        DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
                    GROUP BY
                        erp_id,
                        attendance_date
                ) AS log_summary
            JOIN
                faculty f ON log_summary.erp_id = f.erpid
            JOIN
                departments d ON f.department_id = d.id
            WHERE f.department_id = ANY(${deptIds})
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
                          DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date AND
                          DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
                      GROUP BY
                          erp_id,
                          attendance_date
                  ) AS log_summary
              JOIN
                  faculty f ON log_summary.erp_id = f.erpid
              JOIN
                  departments d ON f.department_id = d.id
              ORDER BY d.name, f.name, log_summary.attendance_date
          `;
      }

      const rows = Array.isArray(records) ? records : (records.rows || []);
      if (!rows || rows.length === 0) {
          return res.status(404).send('No attendance data found for the selected criteria.');
      }

      if (format === 'pdf') {
        // Generate PDF with table formatting
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=faculty_attendance.pdf');
        doc.pipe(res);

        doc.fontSize(16).text('Faculty Attendance Report', { align: 'center' });
        doc.moveDown();

        // Table columns (add Half/Full Day)
        const headers = ['Date', 'Faculty Name', 'ERP ID', 'Department', 'First Log', 'Last Log', 'Duration (HH:MM:SS)', 'Half/Full Day'];
        const colWidths = [80, 140, 70, 160, 70, 70, 120, 90];
        const startX = doc.x;
        let y = doc.y;

        // Draw header row
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
          doc.y = y; // Sync doc.y with y
        }
        drawHeader();

        // Robust UTC-to-IST conversion for time and date
        function toISTTimeString(utcDateString) {
          const date = new Date(utcDateString);
          const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(utc + istOffset);
          return istDate.toTimeString().split(' ')[0];
        }
        function toISTDateString(utcDateString) {
          const date = new Date(utcDateString);
          const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(utc + istOffset);
          return istDate.toISOString().split('T')[0];
        }

        // Draw data rows
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
          // Add new page if needed (every 25 rows)
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
        // Generate Excel file using exceljs
        const ExcelJS = require('exceljs');
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
          const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(utc + istOffset);
          return istDate.toISOString().split('T')[0];
        }
        function toISTTimeString(utcDateString) {
          const date = new Date(utcDateString);
          const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(utc + istOffset);
          return istDate.toTimeString().split(' ')[0];
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
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utc + istOffset);
        return istDate.toISOString().split('T')[0];
      }
      function toISTTimeString(utcDateString) {
        const date = new Date(utcDateString);
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utc + istOffset);
        return istDate.toTimeString().split(' ')[0];
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

// REPLACE the /student-attendance-today endpoint with this:
router.get('/student-attendance-today', async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Query for unique present students today
    const rows = await sql`
      SELECT DISTINCT erpid
      FROM student_attendance
      WHERE date = ${todayStr} AND status = 'Present'
    `;

    res.json({ count: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch present students' });
  }
});


router.get('/view-stress-level', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.query;
    if (!facultyId) {
      return res.status(400).json({ message: 'facultyId is required' });
    }
    // Try to find in faculty
    let person = await sql`SELECT id, erpid, name FROM faculty WHERE erpid = ${facultyId}`;
    if (!person.length) {
      // Try to find in non_teaching_staff
      person = await sql`SELECT id, erpid, name FROM non_teaching_staff WHERE erpid = ${facultyId}`;
      if (!person.length) {
        return res.status(404).json({ message: 'Person not found' });
      }
    }
    // Get all stress logs for this person
    const logs = await sql`
      SELECT id, erpid, timestamp, stress_status, stress_level
      FROM stress_logs
      WHERE erpid = ${facultyId}
      ORDER BY timestamp DESC
    `;
    // Attach name to each log
    const logsWithName = logs.map(log => ({
      ...log,
      name: person[0].name
    }));
    res.json(logsWithName);
  } catch (error) {
    console.error('Error fetching stress data:', error);
    res.status(500).json({ message: 'Error fetching stress data' });
  }
});

// Faculty Stress Report
router.get('/faculty-stress-report', async (req, res) => {
  try {
    const { departmentId, fromDate, toDate, format } = req.query;
    const from = fromDate || '1900-01-01';
    const to = toDate || '2100-12-31';
    let records;
    if (departmentId && departmentId !== 'all') {
      let deptIds = departmentId.includes(',') ? departmentId.split(',').map(Number) : [Number(departmentId)];
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          sl.timestamp,
          sl.stress_status,
          sl.stress_level
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.department_id = ANY(${deptIds})
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
        ORDER BY d.name, f.name, sl.timestamp
      `;
    } else {
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          sl.timestamp,
          sl.stress_status,
          sl.stress_level
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
        ORDER BY d.name, f.name, sl.timestamp
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No stress data found for the selected criteria.');
    }
    // Robust UTC-to-IST conversion for time and date
    function toISTTimeString(utcDateString) {
      const date = new Date(utcDateString);
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(utc + istOffset);
      return istDate.toTimeString().split(' ')[0];
    }
    function toISTDateString(utcDateString) {
      const date = new Date(utcDateString);
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(utc + istOffset);
      return istDate.toISOString().split('T')[0];
    }
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_stress_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Faculty Stress Report', { align: 'center' });
      doc.moveDown();
      const headers = ['Date', 'Faculty Name', 'ERP ID', 'Department', 'Time', 'Stress Status', 'Stress Level'];
      const colWidths = [80, 140, 70, 160, 70, 120, 90];
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
      let rowCount = 0;
      rows.forEach(r => {
        const row = [
          toISTDateString(r.timestamp),
          r.faculty_name,
          r.erpid,
          r.department_name,
          toISTTimeString(r.timestamp),
          r.stress_status,
          r.stress_level
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
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Faculty Stress');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Faculty Name', key: 'faculty_name', width: 25 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Department', key: 'department_name', width: 25 },
        { header: 'Time', key: 'time', width: 15 },
        { header: 'Stress Status', key: 'stress_status', width: 18 },
        { header: 'Stress Level', key: 'stress_level', width: 15 },
      ];
      rows.forEach(r => {
        worksheet.addRow({
          date: toISTDateString(r.timestamp),
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          department_name: r.department_name,
          time: toISTTimeString(r.timestamp),
          stress_status: r.stress_status,
          stress_level: r.stress_level,
        });
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_stress_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV
    const csvHeader = 'Date,Faculty Name,ERP ID,Department,Time,Stress Status,Stress Level\n';
    const csvRows = rows.map(r => [
      toISTDateString(r.timestamp),
      `"${r.faculty_name}"`,
      r.erpid,
      `"${r.department_name}"`,
      toISTTimeString(r.timestamp),
      r.stress_status,
      r.stress_level
    ].join(','));
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('faculty_stress_report.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating stress report:', error);
    res.status(500).json({ message: 'Failed to generate stress report' });
  }
});

module.exports = router;



















































