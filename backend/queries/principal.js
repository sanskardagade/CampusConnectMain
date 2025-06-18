module.exports = {
  // Dashboard statistics
  getDashboardStats: `
    SELECT 
      (SELECT COUNT(*) FROM departments) AS departments,
      (SELECT COUNT(*) FROM students) AS students,
      (SELECT COUNT(*) FROM faculty WHERE is_active = true) AS faculty,
      (SELECT COUNT(*) FROM non_teaching_staff) AS staff
  `,

  // Get all departments
  getDepartments: `
    SELECT id, name, short_code AS code 
    FROM departments 
    ORDER BY name
  `,

  // Get members by type and department
  getStudentsByDept: `
    SELECT id, erpid, name, email, year, division
    FROM students
    WHERE department_id = $1
    ORDER BY name
  `,

  getFacultyByDept: `
    SELECT id, erpid, name, email
    FROM faculty
    WHERE department_id = $1 AND is_active = true
    ORDER BY name
  `,

  getStaffByDept: `
    SELECT id, erpid, name, email
    FROM non_teaching_staff
    WHERE department_id = $1
    ORDER BY name
  `,

  // Get student profile
  getStudentProfile: `
    SELECT 
      s.id, s.erpid, s.name, s.email, s.contact_no AS phone, 
      s.dob, s.year, s.division, s.roll_no,
      d.name AS department
    FROM students s
    JOIN departments d ON s.department_id = d.id
    WHERE s.id = $1
  `,

  // Get faculty profile
  getFacultyProfile: `
    SELECT 
      f.id, f.erpid, f.name, f.email,
      d.name AS department
    FROM faculty f
    JOIN departments d ON f.department_id = d.id
    WHERE f.id = $1
  `,

  // Get faculty logs (attendance)
  getFacultyLogs: `
    SELECT 
      classroom, timestamp AS date,
      CASE WHEN person_name = '' THEN 'Unknown' ELSE person_name END AS name
    FROM faculty_logs
    WHERE erp_id = (SELECT erpid FROM faculty WHERE id = $1)
    ORDER BY timestamp DESC
    LIMIT 10
  `,

  // Get faculty stress levels
  getFacultyStress: `
    SELECT 
      timestamp AS recorded_at,
      stress_status AS status,
      confidence_score AS confidence
    FROM stress_logs
    WHERE erpid = (SELECT erpid FROM faculty WHERE id = $1)
    ORDER BY timestamp DESC
    LIMIT 5
  `,

  // Get staff profile
  getStaffProfile: `
    SELECT 
      id, erpid, name, email,
      (SELECT name FROM departments WHERE id = department_id) AS department
    FROM non_teaching_staff
    WHERE id = $1
  `
};