const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Faculty = require('../models/Faculty');
const FacultyLog = require('../models/FacultyLogs');
const sql = require('../config/neonsetup');
const bcrypt = require('bcrypt');
const FacultyLeave = require('../models/FacultyLeave');

// Get faculty dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const erpStaffId = req.user.erpStaffId;
    // console.log('Looking up faculty with erpStaffId:', erpStaffId);

    const faculty = await Faculty.findByErpStaffId(erpStaffId);
    // console.log('Found faculty:', faculty);

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const facultylog = await FacultyLog.findByErpStaffIdforLogs(erpStaffId);
    // console.log(facultylog);

    if(!facultylog) {
      console.log('FacultyLog not found for erpStaffId:', erpStaffId);
    }

    // Return faculty info
    const response = {
      name: faculty.name,
      erpStaffId: faculty.erpStaffId,
      department: faculty.departmentId,
      email: faculty.email,
      logs: facultylog || null
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
    
    console.log('Query result:', result);
    
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

// Get all faculty members
// router.get('/', authenticateToken, async (req, res) => {
//   try {
//     const faculty = await Faculty.getAll();
//     console.log(faculty);
//     res.json(faculty);
//   } catch (error) {
//     console.error('Error fetching faculty:', error);
//     res.status(500).json({ message: 'Error fetching faculty data' });
//   }
// });

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

module.exports = router; 