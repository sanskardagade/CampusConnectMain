const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const sql = require('../config/neonsetup');
const Hod = require('../models/Hod');

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
        FROM department 
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

    console.log('Query result:', result);
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

module.exports = router; 