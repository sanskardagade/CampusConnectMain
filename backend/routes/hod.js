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
      const headers = ['S.No', 'Date', 'Faculty Name', 'ERP ID', 'Department', 'First Log', 'Last Log', 'Duration (HH:MM:SS)', 'Half/Full Day'];
      const colWidths = [40, 80, 140, 70, 160, 70, 70, 120, 90];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
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
      let serialNumber = 1;
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
          serialNumber.toString(),
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
        serialNumber++;
        if (rowCount % 20 === 0) {
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
        { header: 'S.No', key: 'serial_no', width: 10 },
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
      let serialNumber = 1;
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
          serial_no: serialNumber,
          date: toISTDateString(r.first_log),
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          department_name: r.department_name,
          first_log: firstLog.toTimeString().split(' ')[0],
          last_log: lastLog.toTimeString().split(' ')[0],
          duration,
          half_full: halfFull,
        });
        serialNumber++;
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
    const csvHeader = 'S.No,Date,Faculty Name,ERP ID,Department,First Log,Last Log,Duration (HH:MM:SS),Half/Full Day\n';
    let serialNumber = 1;
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
      const row = [
        serialNumber,
        toISTDateString(r.first_log),
        `"${r.faculty_name}"`,
        r.erpid,
        `"${r.department_name}"`,
        firstLog.toTimeString().split(' ')[0],
        lastLog.toTimeString().split(' ')[0],
        duration,
        halfFull
      ];
      serialNumber++;
      return row.join(',');
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
          sl.stress_level
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.erpid = ${faculty}
          AND f.department_id = ${departmentId}
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${fromDate}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${toDate}::date
        ORDER BY f.name
      `;
    } else {
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          sl.stress_level
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.department_id = ${departmentId}
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${fromDate}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${toDate}::date
        ORDER BY f.name
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No stress data found for the selected criteria.');
    }

    // Aggregate data by faculty only (not by date)
    const aggregatedData = {};
    rows.forEach(row => {
      const key = `${row.faculty_name}_${row.erpid}_${row.department_name}`;
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          faculty_name: row.faculty_name,
          erpid: row.erpid,
          department_name: row.department_name,
          stressed_count: 0,
          unstressed_count: 0
        };
      }
      
      // Count stressed levels (L1, L2, L3)
      if (['L1', 'L2', 'L3'].includes(row.stress_level)) {
        aggregatedData[key].stressed_count++;
      }
      // Count unstressed levels (A1, A2, A3)
      else if (['A1', 'A2', 'A3'].includes(row.stress_level)) {
        aggregatedData[key].unstressed_count++;
      }
    });

    // Convert to array and add verdict
    const finalData = Object.values(aggregatedData).map(item => ({
      ...item,
      verdict: item.stressed_count > item.unstressed_count ? 'Stressed' : 'Unstressed'
    }));

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_stress_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Faculty Stress Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${fromDate} To: ${toDate}`, { align: 'center' });
      doc.moveDown();
      // Add stress level indicators
      doc.fontSize(10).text('Stress Level Indicators:', { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(8).text('STRESS: L1 - 70-80  | L2 - 80-90  | L3 - 90-100', { align: 'left' });
      doc.moveDown(0.1);
      doc.fontSize(8).text('UNSTRESS: A1 - 90-100  | A2 - 80-90  | A3 - 70-80', { align: 'left' });
      doc.moveDown();
      const headers = ['S.No', 'Faculty Name', 'ERP ID', 'Department', 'Stressed Count', 'Unstressed Count', 'Verdict'];
      const colWidths = [40, 200, 70, 200, 100, 100, 80];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
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
      let serialNumber = 1;
      finalData.forEach(r => {
        const row = [
          serialNumber.toString(),
          r.faculty_name,
          r.erpid,
          r.department_name,
          r.stressed_count.toString(),
          r.unstressed_count.toString(),
          r.verdict
        ];
        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        serialNumber++;
        if (rowCount % 20 === 0) {
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
      const worksheet = workbook.addWorksheet('Faculty Stress');
      
      // Add title and date range
      worksheet.addRow(['Faculty Stress Report']);
      worksheet.addRow([`From: ${fromDate} To: ${toDate}`]);
      worksheet.addRow([]); // Empty row for spacing
      
      worksheet.columns = [
        { header: 'S.No', key: 'serial_no', width: 10 },
        { header: 'Faculty Name', key: 'faculty_name', width: 25 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Department', key: 'department_name', width: 25 },
        { header: 'Stressed Count', key: 'stressed_count', width: 15 },
        { header: 'Unstressed Count', key: 'unstressed_count', width: 15 },
        { header: 'Verdict', key: 'verdict', width: 15 },
      ];
      let serialNumber = 1;
      finalData.forEach(r => {
        worksheet.addRow({
          serial_no: serialNumber,
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          department_name: r.department_name,
          stressed_count: r.stressed_count,
          unstressed_count: r.unstressed_count,
          verdict: r.verdict,
        });
        serialNumber++;
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_stress_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV
    const csvHeader = `Faculty Stress Report\nFrom: ${fromDate} To: ${toDate}\n\nS.No,Faculty Name,ERP ID,Department,Stressed Count,Unstressed Count,Verdict\n`;
    let serialNumber = 1;
    const csvRows = finalData.map(r => [
      serialNumber,
      `"${r.faculty_name}"`,
      r.erpid,
      `"${r.department_name}"`,
      r.stressed_count,
      r.unstressed_count,
      r.verdict
    ].join(','));
    serialNumber++;
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('faculty_stress_report.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating stress report:', error);
    res.status(500).json({ message: 'Failed to generate stress report' });
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

// Get faculty stress levels for HOD's department
router.get('/view-stress-level', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.query;
    const departmentId = req.user.departmentId;
    
    if (facultyId) {
      // Get specific faculty stress data
      const [faculty] = await sql`
        SELECT id, erpid, name FROM faculty 
        WHERE erpid = ${facultyId} AND department_id = ${departmentId}
      `;
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found in your department' });
      }
      
      // Get all stress logs for this faculty
      const logs = await sql`
        SELECT id, erpid, timestamp, stress_status, stress_level
        FROM stress_logs
        WHERE erpid = ${facultyId}
        ORDER BY timestamp DESC
      `;
      
      // Attach name to each log
      const logsWithName = logs.map(log => ({
        ...log,
        name: faculty.name
      }));
      res.json(logsWithName);
    } else {
      // Get all faculty stress data for the department
      const result = await sql`
        SELECT 
          sl.id, 
          sl.erpid, 
          sl.timestamp, 
          sl.stress_status, 
          sl.stress_level,
          f.name
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        WHERE f.department_id = ${departmentId}
        ORDER BY sl.timestamp DESC
      `;
      res.json(result);
    }
  } catch (error) {
    console.error('Error fetching faculty stress data:', error);
    res.status(500).json({ message: 'Error fetching faculty stress data' });
  }
});

// Get faculty members for stress level view (department-specific)
router.get('/faculty-stress-members', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const faculty = await sql`
      SELECT id, erpid, name, email
      FROM faculty 
      WHERE department_id = ${departmentId} AND is_active = true
      ORDER BY name ASC
    `;
    res.json({ members: faculty });
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    res.status(500).json({ message: 'Error fetching faculty members' });
  }
});

// Endpoint to fetch today's faculty attendance count for HOD's department
router.get('/faculty-today-attendance-count', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Count unique faculty erp_id with a log today in this department
    const result = await sql`
      SELECT COUNT(DISTINCT fl.erp_id) AS count
      FROM faculty_logs fl
      JOIN faculty f ON fl.erp_id = f.erpid
      WHERE f.department_id = ${departmentId}
        AND fl.timestamp::date = ${todayStr}
    `;
    res.json({ count: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching today faculty attendance count:', error);
    res.status(500).json({ message: 'Error fetching today faculty attendance count' });
  }
});

// Endpoint to fetch today's student attendance count for HOD's department
router.get('/student-today-attendance-count', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Count unique student erpid with a present attendance log today in this department
    const result = await sql`
      SELECT COUNT(DISTINCT sa.erpid) AS count
      FROM student_attendance sa
      JOIN students s ON sa.erpid = s.erpid
      WHERE s.department_id = ${departmentId}
        AND sa.date = ${todayStr}
        AND sa.status = 'Present'
    `;
    res.json({ count: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching today student attendance count:', error);
    res.status(500).json({ message: 'Error fetching today student attendance count' });
  }
});

// Endpoint to fetch today's non-teaching staff attendance count for HOD's department
router.get('/nonteaching-today-attendance-count', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Count unique non-teaching staff erpid with a log today in this department
    const result = await sql`
      SELECT COUNT(DISTINCT fl.erp_id) AS count
      FROM faculty_logs fl
      JOIN non_teaching_staff nts ON fl.erp_id = nts.erpid
      WHERE nts.department_id = ${departmentId}
        AND fl.timestamp::date = ${todayStr}
    `;
    res.json({ count: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching today non-teaching staff attendance count:', error);
    res.status(500).json({ message: 'Error fetching today non-teaching staff attendance count' });
  }
});

// faculty-attendance-data
router.get('/faculty-attendance-data', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const { faculty, from, to, location } = req.query;
    const fromDate = from || '1900-01-01';
    const toDate = to || '2100-12-31';

    // Validate departmentId exists
    if (!departmentId) {
      return res.status(400).json({ 
        message: 'Department ID is required',
        error: 'Missing departmentId in user token' 
      });
    }

    // Base query with parameterized values
    let query = sql`
      SELECT 
        fl.id,
        f.name as faculty_name,
        fl.erp_id,
        fl.timestamp,
        fl.classroom,
        fl.camera_ip
      FROM faculty_logs fl
      JOIN faculty f ON fl.erp_id = f.erpid
      WHERE f.department_id = ${departmentId}
        AND fl.timestamp >= ${fromDate}::timestamp
        AND fl.timestamp <= ${toDate}::timestamp
    `;

    // Add optional filters
    if (faculty && faculty !== 'all') {
      query = sql`${query} AND fl.erp_id = ${faculty}`;
    }
    
    if (location && location !== 'all') {
      query = sql`${query} AND (fl.classroom = ${location} OR fl.camera_ip = ${location})`;
    }

    query = sql`${query} ORDER BY fl.timestamp ASC`;

    // Execute query with error handling
    let result;
    try {
      result = await query;
    } catch (dbError) {
      console.error('Database query failed:', {
        error: dbError.message,
        query: dbError.query,
        parameters: dbError.parameters
      });
      throw new Error('Failed to execute database query');
    }

    // Process the data safely
    const processData = (rows) => {
      const grouped = {};
      
      // First pass: group by faculty/date/location
      rows.forEach(row => {
        try {
          const date = new Date(row.timestamp).toISOString().split('T')[0];
          const locationKey = row.classroom || row.camera_ip || 'Unknown';
          const key = `${row.erp_id}|${date}|${locationKey}`;
          
          if (!grouped[key]) {
            grouped[key] = {
              date,
              faculty_name: row.faculty_name || 'Unknown',
              erpid: row.erp_id,
              location: locationKey,
              logs: []
            };
          }
          grouped[key].logs.push(new Date(row.timestamp));
        } catch (e) {
          console.warn('Error processing row:', { row, error: e.message });
        }
      });

      // Second pass: calculate time differences
      return Object.values(grouped).map(item => {
        const sortedLogs = item.logs.sort((a, b) => a - b);
        const firstLog = sortedLogs[0];
        const lastLog = sortedLogs[sortedLogs.length - 1];
        let duration = 0;
        
        if (firstLog && lastLog) {
          duration = lastLog - firstLog; // duration in milliseconds
        }

        return {
          date: item.date,
          faculty_name: item.faculty_name,
          erpid: item.erpid,
          location: item.location,
          first_log: firstLog,
          last_log: lastLog,
          duration_ms: duration,
          log_count: item.logs.length
        };
      });
    };

    const chartData = processData(result || []);

    res.json(chartData);

  } catch (error) {
    console.error('Error in faculty-attendance-data endpoint:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      queryParams: req.query,
      user: {
        id: req.user?.id,
        departmentId: req.user?.departmentId
      }
    });

    res.status(500).json({ 
      message: 'Failed to fetch attendance data',
      error: error.message,
      details: 'Check server logs for more information' 
    });
  }
});

// Faculty Leave Report for HOD
router.get('/faculty-leave-report', authenticateToken, async (req, res) => {
  try {
    const { faculty, fromDate, toDate, format } = req.query;
    const departmentId = req.user.departmentId;
    const from = fromDate || '1900-01-01';
    const to = toDate || '2100-12-31';
    
    let records;
    if (faculty && faculty !== 'all') {
      records = await sql`
        SELECT
          fl."StaffName" AS faculty_name,
          fl."ErpStaffId" AS erpid,
          TO_CHAR(fl."fromDate", 'YYYY-MM-DD') AS leave_date,
          d.name AS department_name,
          fl."reason"
        FROM faculty_leave fl
        JOIN faculty f ON fl."ErpStaffId" = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.erpid = ${faculty}
          AND f.department_id = ${departmentId}
          AND fl."fromDate" >= ${from}::date
          AND fl."toDate" <= ${to}::date
        ORDER BY d.name, fl."StaffName", fl."fromDate"
      `;
    } else {
      records = await sql`
        SELECT
          fl."StaffName" AS faculty_name,
          fl."ErpStaffId" AS erpid,
          TO_CHAR(fl."fromDate", 'YYYY-MM-DD') AS leave_date,
          d.name AS department_name,
          fl."reason"
        FROM faculty_leave fl
        JOIN faculty f ON fl."ErpStaffId" = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.department_id = ${departmentId}
          AND fl."fromDate" >= ${from}::date
          AND fl."toDate" <= ${to}::date
        ORDER BY d.name, fl."StaffName", fl."fromDate"
      `;
    }

    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No leave data found for the selected criteria.');
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_leave_report.pdf');
      doc.pipe(res);

      doc.fontSize(16).text('Faculty Leave Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${from} To: ${to}`, { align: 'center' });
      doc.moveDown();

      const headers = ['S.No', 'Name', 'ERP ID', 'Date', 'Department', 'Reason'];
      const colWidths = [40, 150, 80, 80, 150, 300];
      const startX = doc.x;
      let y = doc.y;

      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
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
      let serialNumber = 1;

      rows.forEach(r => {
        const row = [
          serialNumber.toString(),
          r.faculty_name,
          r.erpid,
          r.leave_date,
          r.department_name,
          r.reason
        ];

        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        serialNumber++;

        if (rowCount % 20 === 0) {
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
      const worksheet = workbook.addWorksheet('Faculty Leave');
      
      // Add title and date range
      worksheet.addRow(['Faculty Leave Report']);
      worksheet.addRow([`From: ${from} To: ${to}`]);
      worksheet.addRow([]); // Empty row for spacing
      
      worksheet.columns = [
        { header: 'S.No', key: 'serial_no', width: 10 },
        { header: 'Name', key: 'faculty_name', width: 20 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Date', key: 'leave_date', width: 15 },
        { header: 'Department', key: 'department_name', width: 20 },
        { header: 'Reason', key: 'reason', width: 40 },
      ];

      let serialNumber = 1;
      rows.forEach(r => {
        worksheet.addRow({
          serial_no: serialNumber,
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          leave_date: r.leave_date,
          department_name: r.department_name,
          reason: r.reason,
        });
        serialNumber++;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_leave_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    // CSV
    const csvHeader = `Faculty Leave Report\nFrom: ${from} To: ${to}\n\nS.No,Name,ERP ID,Date,Department,Reason\n`;
    let serialNumber = 1;
    const csvRows = rows.map(r => [
      serialNumber,
      `"${r.faculty_name}"`,
      r.erpid,
      r.leave_date,
      `"${r.department_name}"`,
      `"${r.reason}"`
    ].join(','));
    serialNumber++;
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('faculty_leave_report.csv');
    return res.send(csvData);

  } catch (error) {
    console.error('Error generating leave report:', error);
    res.status(500).json({ message: 'Failed to generate leave report' });
  }
});

module.exports = router; 