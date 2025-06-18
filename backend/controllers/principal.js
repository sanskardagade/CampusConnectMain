const db = require('../config/neonsetup');

// Get dashboard overview stats
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard statistics...');
    
    // Get counts in parallel
    const [departmentsCount, studentsCount, facultyCount, staffCount] = await Promise.all([
      db`SELECT COUNT(*)::int FROM departments`,
      db`SELECT COUNT(*)::int FROM students`,
      db`SELECT COUNT(*)::int FROM faculty WHERE is_active = true`,
      db`SELECT COUNT(*)::int FROM non_teaching_staff`
    ]);

    // Get department list
    const departments = await db`
      SELECT id, name, short_code AS code 
      FROM departments 
      ORDER BY name
    `;

    // Verify all queries returned data
    if (!departmentsCount || !studentsCount || !facultyCount || !staffCount || !departments) {
      throw new Error('One or more queries returned empty results');
    }

    const stats = {
      departments: departmentsCount[0].count,
      students: studentsCount[0].count,
      faculty: facultyCount[0].count,
      staff: staffCount[0].count
    };

    console.log('Successfully fetched dashboard stats:', stats);
    
    res.json({
      stats,
      departments
    });

  } catch (err) {
    console.error('Error in getDashboardStats:', err);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

// Get members by department and type
exports.getDepartmentMembers = async (req, res) => {
  const { deptId, type } = req.query;
  
  if (!deptId || !type) {
    return res.status(400).json({ error: 'Missing department ID or member type' });
  }

  try {
    console.log(`Fetching ${type} for department ${deptId}`);
    
    let members;
    switch (type) {
      case 'students':
        members = await db`
          SELECT id, erpid, name, email, year, division
          FROM students
          WHERE department_id = ${deptId}
          ORDER BY name
        `;
        break;
        
      case 'faculty':
        members = await db`
          SELECT id, erpid, name, email
          FROM faculty
          WHERE department_id = ${deptId} AND is_active = true
          ORDER BY name
        `;
        break;
        
      case 'staff':
        members = await db`
          SELECT id, erpid, name, email
          FROM non_teaching_staff
          WHERE department_id = ${deptId}
          ORDER BY name
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid member type' });
    }

    if (!members || members.length === 0) {
      return res.status(404).json({ error: 'No members found' });
    }

    res.json({ members });

  } catch (err) {
    console.error(`Error fetching ${type} members:`, err);
    res.status(500).json({ 
      error: `Failed to fetch ${type} members`,
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

// Get member profile
exports.getMemberProfile = async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  if (!id || !type) {
    return res.status(400).json({ error: 'Missing member ID or type' });
  }

  try {
    console.log(`Fetching ${type} profile for ID ${id}`);
    
    let profile, extraData = {};
    
    switch (type) {
      case 'students':
        profile = await db`
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
        [profile, extraData] = await Promise.all([
          db`
            SELECT 
              f.id, f.erpid, f.name, f.email,
              d.name AS department
            FROM faculty f
            JOIN departments d ON f.department_id = d.id
            WHERE f.id = ${id}
          `,
          (async () => {
            const [logs, stress] = await Promise.all([
              db`
                SELECT 
                  classroom, 
                  timestamp AS date,
                  CASE WHEN person_name = '' THEN 'Unknown' ELSE person_name END AS name
                FROM faculty_logs
                WHERE erp_id = (SELECT erpid FROM faculty WHERE id = ${id})
                ORDER BY timestamp DESC
                LIMIT 10
              `,
              db`
                SELECT 
                  timestamp AS recorded_at,
                  stress_status AS status,
                  confidence_score AS confidence
                FROM stress_logs
                WHERE erpid = (SELECT erpid FROM faculty WHERE id = ${id})
                ORDER BY timestamp DESC
                LIMIT 5
              `
            ]);
            
            return {
              attendance: {
                recent: logs.map(log => ({
                  date: log.date.toISOString().split('T')[0],
                  status: log.name === 'Unknown' ? 'Absent' : 'Present',
                  classroom: log.classroom
                })),
                percentage: calculateAttendancePercentage(logs)
              },
              stressLevel: stress[0]?.status || 'Normal'
            };
          })()
        ]);
        break;
        
      case 'staff':
        profile = await db`
          SELECT 
            id, erpid, name, email,
            (SELECT name FROM departments WHERE id = department_id) AS department
          FROM non_teaching_staff
          WHERE id = ${id}
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid member type' });
    }

    if (!profile || profile.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      ...profile[0],
      ...extraData
    });

  } catch (err) {
    console.error(`Error fetching ${type} profile:`, err);
    res.status(500).json({ 
      error: `Failed to fetch ${type} profile`,
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

// Helper function
function calculateAttendancePercentage(logs) {
  if (!logs || logs.length === 0) return 0;
  const presentCount = logs.filter(log => log.name !== 'Unknown').length;
  return Math.round((presentCount / logs.length) * 100);
}

// const db = require('../config/neonsetup');
// const queries = require('../queries/principal.js');

// // Get dashboard overview stats
// exports.getDashboardStats = async (req, res) => {
//   try {
//     const [stats, departments] = await Promise.all([
//       db.query(queries.getDashboardStats),
//       db.query(queries.getDepartments)
//     ]);

//     res.json({
//       stats: stats.rows[0],
//       departments: departments.rows
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch dashboard data' });
//   }
// };

// // Get members by department and type
// exports.getDepartmentMembers = async (req, res) => {
//   const { deptId, type } = req.query;

//   try {
//     let query;
//     switch (type) {
//       case 'students':
//         query = queries.getStudentsByDept;
//         break;
//       case 'faculty':
//         query = queries.getFacultyByDept;
//         break;
//       case 'staff':
//         query = queries.getStaffByDept;
//         break;
//       default:
//         return res.status(400).json({ error: 'Invalid member type' });
//     }

//     const result = await db.query(query, [deptId]);
//     res.json({ members: result.rows });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch members' });
//   }
// };

// // Get member profile
// exports.getMemberProfile = async (req, res) => {
//   const { id } = req.params;
//   const { type } = req.query;

//   try {
//     let profileQuery, extraData = {};
    
//     switch (type) {
//       case 'students':
//         profileQuery = queries.getStudentProfile;
//         break;
        
//       case 'faculty':
//         profileQuery = queries.getFacultyProfile;
//         // Get attendance logs
//         const [logs, stress] = await Promise.all([
//           db.query(queries.getFacultyLogs, [id]),
//           db.query(queries.getFacultyStress, [id])
//         ]);
//         extraData.attendance = {
//           recent: logs.rows.map(log => ({
//             date: log.date.toISOString().split('T')[0],
//             status: log.name === 'Unknown' ? 'Absent' : 'Present',
//             classroom: log.classroom
//           })),
//           percentage: calculateAttendancePercentage(logs.rows)
//         };
//         extraData.stressLevel = stress.rows[0]?.status || 'Normal';
//         break;
        
//       case 'staff':
//         profileQuery = queries.getStaffProfile;
//         break;
        
//       default:
//         return res.status(400).json({ error: 'Invalid member type' });
//     }

//     const profile = await db.query(profileQuery, [id]);
//     if (profile.rows.length === 0) {
//       return res.status(404).json({ error: 'Member not found' });
//     }

//     res.json({
//       ...profile.rows[0],
//       ...extraData
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch profile' });
//   }
// };

// // Helper function to calculate attendance percentage
// function calculateAttendancePercentage(logs) {
//   if (logs.length === 0) return 0;
//   const presentCount = logs.filter(log => log.name !== 'Unknown').length;
//   return Math.round((presentCount / logs.length) * 100);
// }