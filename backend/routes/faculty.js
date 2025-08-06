const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Faculty = require('../models/Faculty');
// const FacultyLog = require('../models/FacultyLogs');
const sql = require('../config/neonsetup');
const bcrypt = require('bcrypt');
const FacultyLeave = require('../models/FacultyLeave');

// Get faculty dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date query parameter is required.' });
    }

    const faculty = await Faculty.findByErpStaffId(erpStaffId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const facultylog = await Faculty.findByErpStaffIdAndDateRange(erpStaffId, date);

    const response = {
      name: faculty.name,
      erpStaffId: faculty.erpStaffId,
      department: faculty.departmentId,
      email: faculty.email,
      logs: facultylog || []
    };
    res.json(response);
  } catch (error) {
    console.error('Error in faculty dashboard:', error);
    res.status(500).json({ 
      message: 'Error fetching faculty dashboard data',
      error: error.message 
    });
  }
});

// Get faculty by department
router.get('/department/:department', authenticateToken, async (req, res) => {
  try {
    const { department } = req.params;
    const faculty = await Faculty.getByDepartment(department);
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty by department:', error);
    res.status(500).json({ message: 'Error fetching faculty data' });
  }
});

// Update faculty profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Update profile request received:', req.body);
    console.log('Auth user:', req.user);
    const erpStaffId = req.user.erpStaffId;
    console.log('User erpStaffId:', erpStaffId);
    
    // Only allow updating email
    const { email } = req.body;
    if (!email) {
      console.log('Email not provided in request');
      return res.status(400).json({ message: 'Email is required' });
    }

    // First verify faculty exists
    const facultyCheck = await sql`
      SELECT erpid FROM faculty WHERE erpid = ${erpStaffId}::text
    `;
    console.log('Faculty check result:', facultyCheck);

    if (facultyCheck.length === 0) {
      console.log('Faculty not found in database with erpStaffId:', erpStaffId);
      return res.status(404).json({ message: 'Faculty not found' });
    }

    console.log('Updating faculty email...');
    const updatedFaculty = await Faculty.update(erpStaffId, { email });
    console.log('Update result:', updatedFaculty);
    
    if (!updatedFaculty) {
      console.log('Faculty not found after update with erpStaffId:', erpStaffId);
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const response = {
      name: updatedFaculty.name,
      erpStaffId: updatedFaculty.erpStaffId,
      department: updatedFaculty.department,
      email: updatedFaculty.email
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Detailed error in profile update:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ 
      message: 'Error updating faculty profile',
      error: error.message,
      detail: error.detail
    });
  }
});

// Update faculty member
router.put('/:erpStaffId', authenticateToken, async (req, res) => {
  try {
    const { erpStaffId } = req.params;
    const updateData = req.body;

    const faculty = await Faculty.update(erpStaffId, updateData);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json(faculty);
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ message: 'Error updating faculty member' });
  }
});

// Create new faculty member
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      erpStaffId,
      staffName,
      email,
      password,
      branch,
      department,
      designation,
      contactNo,
      subjects,
      assignedClasses
    } = req.body;

    const faculty = await Faculty.create({
      erpStaffId,
      staffName,
      email,
      password,
      branch,
      department,
      designation,
      contactNo,
      subjects,
      assignedClasses
    });

    res.status(201).json(faculty);
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(500).json({ message: 'Error creating faculty member' });
  }
});

// Get student stress levels
router.get('/student-stress-level', authenticateToken, async (req, res) => {
  try {
    console.log('API call received at:', new Date().toISOString());
    
    // Fetch all student stress data from the database
    const result = await sql`
      SELECT * FROM stress_logs WHERE id between 1 and 34
      ORDER BY id ASC
    `;
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching student stress data:', error);
    res.status(500).json({ message: 'Error fetching student stress data' });
  }
});

// Submit leave application
router.post("/leave-apply", authenticateToken, async (req, res) => {
  try {
    const {  
      ApplicationDate,
      StaffName,
      ErpStaffId,
      fromDate,
      toDate,
      reason,
      leavetype
    } = req.body;

    console.log("the data is:",req.body);

    const facultyleave =  FacultyLeave.AddLeaveIntoTable(req.body);
    console.log(facultyleave);
    res.status(200).json({ 
      message: 'Leave application submitted successfully!',
    });
  } catch (error) {
    console.error("Error submitting leave application:", error);
    res.status(500).json({ message: 'Error submitting leave application' });
  }
});

// Get leave applications for faculty
router.get("/leave-apply", authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    console.log('Fetching leave applications for faculty:', erpStaffId);
    console.log('User object:', req.user);
    
    if (!erpStaffId) {
      console.error('No erpStaffId found in user object');
      return res.status(400).json({ 
        message: 'Invalid user data',
        error: 'No erpStaffId found'
      });
    }

    const result = await sql`
      SELECT * FROM faculty_leave 
      WHERE "ErpStaffId" = ${erpStaffId}
      ORDER BY "ApplicationDate" DESC
    `;

    console.log('hello Query result:', result[0]);
    
    if (!result) {
      console.log('No leave applications found for faculty:', erpStaffId);
      return res.json([]);
    }
    
    // Ensure we're sending an array
    const leaveApplications = Array.isArray(result) ? result : [result];
    console.log('Sending response:', leaveApplications);
    
    res.json(leaveApplications);
  } catch (error) {
    console.error("Error in leave-apply GET endpoint:", error);
    res.status(500).json({ 
      message: 'Error fetching leave applications',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get faculty leave balances
router.get("/leave-balances", authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    console.log('Fetching leave balances for faculty:', erpStaffId);
    
    if (!erpStaffId) {
      console.error('No erpStaffId found in user object');
      return res.status(400).json({ 
        message: 'Invalid user data',
        error: 'No erpStaffId found'
      });
    }

    const result = await sql`
      SELECT 
        "ErpStaffId",
        sick,
        academic,
        emergency,
        maternity,
        family,
        travel,
        other,
        created_at,
        updated_at
      FROM faculty_leave_balances 
      WHERE "ErpStaffId" = ${erpStaffId}
    `;
    
    console.log('Leave balances query result:', result);
    
    if (!result || result.length === 0) {
      console.log('No leave balances found for faculty:', erpStaffId);
      return res.status(404).json({ 
        message: 'Leave balances not found for this faculty',
        error: 'No leave balance record exists'
      });
    }
    
    console.log('Sending leave balances response:', result[0]);
    res.json(result[0]);
  } catch (error) {
    console.error("Error in leave-balances GET endpoint:", error);
    res.status(500).json({ 
      message: 'Error fetching leave balances',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all task history for current faculty
router.get('/task-history', authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    
    if (!erpStaffId) {
      return res.status(400).json({ 
        message: 'Invalid user data', 
        error: 'No erpStaffId found' 
      });
    }

    const result = await sql`
      SELECT 
        t.id as task_id,
        t.heading,
        t.message,
        t.file_url,
        t.created_at,
        h.name as hod_name,
        at.id as assigned_task_id,
        at.status,
        at.completed_at,
        at.response_file_url,
        at.submission_message,
        at.is_dismissed
      FROM assigned_tasks at
      JOIN tasks t ON at.task_id = t.id
      LEFT JOIN hod h ON t.hod_erpid = h.erpid
      WHERE at.faculty_erpid = ${erpStaffId}
      ORDER BY t.created_at DESC
    `;

    // Transform the data to include status colors and formatted dates
    const taskHistory = result.map(task => ({
      ...task,
      status_color: 
        task.status === 'completed' ? 'green' :
        task.status === 'pending' ? 'yellow' :
        task.status === 'accepted' ? 'blue' :
        task.status === 'rejected' ? 'red' : 'gray',
      created_at_formatted: new Date(task.created_at).toLocaleDateString(),
      completed_at_formatted: task.completed_at ? new Date(task.completed_at).toLocaleDateString() : null
    }));

    res.json({ 
      total: taskHistory.length,
      completed: taskHistory.filter(t => t.status === 'completed').length,
      pending: taskHistory.filter(t => t.status === 'pending').length,
      rejected: taskHistory.filter(t => t.status === 'rejected').length,
      tasks: taskHistory 
    });

    console.log({ 
      total: taskHistory.length,
      completed: taskHistory.filter(t => t.status === 'completed').length,
      pending: taskHistory.filter(t => t.status === 'pending').length,
      rejected: taskHistory.filter(t => t.status === 'rejected').length,
      tasks: taskHistory 
    });

  } catch (error) {
    console.error('Error fetching task history:', error);
    res.status(500).json({ 
      message: 'Error fetching task history', 
      error: error.message 
    });
  }
});

// Change password route
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('Change password request received')
    const { currentPassword, newPassword } = req.body
    const erpStaffId = req.user.erpStaffId

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }

    // Get faculty from database
    const faculty = await Faculty.getByErpId(erpStaffId)
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, faculty.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    const updated = await Faculty.updatePassword(erpStaffId, hashedPassword)
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update password' })
    }

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error in change password:', error)
    res.status(500).json({ message: 'Error updating password' })
  }
})

// Get assigned tasks for the logged-in faculty
router.get('/assigned-tasks', authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    console.log(erpStaffId);
    if (!erpStaffId) {
      return res.status(400).json({ message: 'Invalid user data', error: 'No erpStaffId found' });
    }
    // Only return tasks that are not dismissed
    const result = await sql`
      SELECT 
        t.id as task_id,
        t.heading,
        t.message,
        t.file_url,
        t.created_at,
        h.name as hod_name,
        at.id as assigned_task_id,
        at.status
      FROM assigned_tasks at
      JOIN tasks t ON at.task_id = t.id
      LEFT JOIN hod h ON t.hod_erpid = h.erpid
      WHERE at.faculty_erpid = ${erpStaffId} AND (at.is_dismissed IS NULL OR at.is_dismissed = FALSE)
      ORDER BY t.created_at DESC
    `;
    res.json({ tasks: result });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Error fetching assigned tasks', error: error.message });
  }
});

// PATCH endpoint to dismiss a task notification
router.patch('/assigned-tasks/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Only allow the faculty to dismiss their own assigned task
    const erpStaffId = req.user.erpStaffId;
    const result = await sql`
      UPDATE assigned_tasks SET is_dismissed = TRUE WHERE id = ${id} AND faculty_erpid = ${erpStaffId}
      RETURNING id
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: 'Task not found or not authorized.' });
    }
    res.status(200).json({ message: 'Task dismissed successfully.' });
  } catch (error) {
    console.error('Error dismissing task:', error);
    res.status(500).json({ error: 'Failed to dismiss task.' });
  }
});

// PATCH: Faculty accepts a task
router.patch('/assigned-tasks/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const facultyErpid = req.user.erpStaffId;

    // Only allow the assigned faculty to accept
    const result = await sql`
      UPDATE assigned_tasks
      SET status = 'accepted', completed_at = NULL, is_dismissed = false
      WHERE id = ${id} AND faculty_erpid = ${facultyErpid}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: 'Task not found or not assigned to you.' });
    }
    res.json({ message: 'Task accepted.', task: result[0] });
  } catch (error) {
    console.error('Error accepting task:', error);
    res.status(500).json({ message: 'Failed to accept task.' });
  }
});

// PATCH: Faculty rejects a task
router.patch('/assigned-tasks/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const facultyErpid = req.user.erpStaffId;

    // Only allow the assigned faculty to reject
    const result = await sql`
      UPDATE assigned_tasks
      SET status = 'rejected', completed_at = NOW()
      WHERE id = ${id} AND faculty_erpid = ${facultyErpid}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: 'Task not found or not assigned to you.' });
    }
    res.json({ message: 'Task rejected.', task: result[0] });
  } catch (error) {
    console.error('Error rejecting task:', error);
    res.status(500).json({ message: 'Failed to reject task.' });
  }
});

// PATCH: Faculty marks task as completed (with optional message and file)
router.patch('/assigned-tasks/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { responseFileUrl, submissionMessage } = req.body;
    const facultyErpid = req.user.erpStaffId;

    const result = await sql`
      UPDATE assigned_tasks
      SET 
        status = 'completed', 
        completed_at = NOW(), 
        response_file_url = ${responseFileUrl},
        submission_message = ${submissionMessage}
      WHERE id = ${id} AND faculty_erpid = ${facultyErpid}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: 'Task not found or not assigned to you.' });
    }
    res.json({ message: 'Task marked as completed.', task: result[0] });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Failed to complete task.' });
  }
});

// Start a new attendance session
router.post('/start-session', authenticateToken, async (req, res) => {
  try {
    const faculty_erpid = req.user.erpStaffId;
    const {
      subject_id,
      department_id,
      year,
      semester,
      division,
      batch,
      session_date,
      start_time,
      end_time,
      location
    } = req.body;

    // Validate required fields
    if (!subject_id || !department_id || !year || !semester || !division || !start_time || !end_time || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Insert session into the database
    const result = await sql`
      INSERT INTO sessions (
        subject_id, faculty_erpid, department_id, year, semester, division, batch, session_date, start_time, end_time, location
      ) VALUES (
        ${subject_id}, ${faculty_erpid}, ${department_id}, ${year}, ${semester}, ${division}, ${batch || null}, ${session_date}, ${start_time}, ${end_time}, ${location}
      ) RETURNING session_id;
    `;

    const sessionId = result[0]?.session_id;
    res.status(201).json({ message: 'Session started successfully', session_id: sessionId });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Error starting session' });
  }
});

// Get students data
router.get('/students-data', authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    console.log(erpStaffId);
    if (!erpStaffId) {
      return res.status(400).json({ message: 'Invalid user data', error: 'No erpStaffId found' });
    }
    // Only return tasks that are not dismissed
    const result = await sql `
      SELECT s.* 
      FROM students s
      JOIN faculty f ON s.class_teacher = f.erpid
      WHERE f.erpid = ${erpStaffId}`;
    res.json(result);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Error fetching assigned tasks', error: error.message });
  }
});

// Get students data
router.get('/students-logs', authenticateToken, async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  const istDate = new Date(date);
  istDate.setMinutes(istDate.getMinutes() + istDate.getTimezoneOffset() + 330); // Adjust to IST
  const newdate = istDate.toISOString().split('T')[0];

  try {
    const erpStaffId = req.user.erpStaffId;

    if (!erpStaffId) {
      return res.status(400).json({ message: 'Invalid user data', error: 'No erpStaffId found' });
    }

    const result = await sql`
      SELECT DISTINCT ON (detected_erpid) *
      FROM attendance_logs_test 
      WHERE detected_at::date = ${newdate} 
        AND detected_erpid IN (
          SELECT s.erpid 
          FROM students s
          JOIN faculty f ON s.class_teacher = f.erpid
          WHERE f.erpid = ${erpStaffId}
        )
      ORDER BY detected_erpid, detected_at;
    `;
    res.json(result);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Error fetching assigned tasks', error: error.message });
  }
});


// routes/faculty.js

router.get('/sessions', async (req, res) => {
  const { date, subject_id } = req.query;

  if (!date || !subject_id) {
    return res.status(400).json({ message: 'Date and subject_id are required' });
  }

  try {
    // Format the input date to ensure correct format
    const formattedDate = new Date(date).toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const result = await sql`
      SELECT 
        session_id,
        subject_id,
        faculty_erpid,
        department_id,
        year,
        semester,
        division,
        batch,
        to_char(session_date, 'YYYY-MM-DD') AS session_date,
        start_time,
        end_time,
        location,
        created_at,
        updated_at
      FROM sessions
      WHERE session_date = ${formattedDate}::date AND subject_id = ${subject_id}
      ORDER BY created_at ASC
    `;

    res.json(result);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

module.exports = router;