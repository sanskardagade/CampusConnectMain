const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const sql = require('../config/neonsetup');
const PrincipalModel = require('../models/Principal.js');
const { verifyPrincipal } = require('../middleware/roleVerification');

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

module.exports = router;

