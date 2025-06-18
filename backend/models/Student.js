const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');

const mapStudent = (row) => ({
  id: row.id,
  erpid: row.erpid,
  name: row.name,
  email: row.email,
  department: row.department,
  semester: row.semester,
  password_hash: row.password_hash,
});

const findByErp = async (erpid) => {
  const [rows] = await sql`
    SELECT * FROM students WHERE erpid = ${erpid} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapStudent(rows[0]);
};

const findByEmail = async (email) => {
  const rows = await sql`
    SELECT * FROM students WHERE email = ${email} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapStudent(rows[0]);
};

const create = async ({ erpid, name, email, password, department, semester }) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await sql`
    INSERT INTO students (erpid, name, email, password_hash, department, semester)
    VALUES (${erpid}, ${name}, ${email}, ${passwordHash}, ${department}, ${semester})
    RETURNING *
  `;

  return mapStudent(result[0]);
};

const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

module.exports = {
  findByErp,
  findByEmail,
  create,
  comparePassword,
  mapStudent
}; 