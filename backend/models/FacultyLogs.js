const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');

// Map faculty DB row to JS object
const mapFacultyLog = (row) => ({
    id: row.id,
    erpStaffId: row.erpid,
    name: row.faculty_name,
    ip: row.camera_ip,
    classroom: row.classroom,
    timestap : row.timestamp,
    createdAt: row.created_at  
});

// Find facultyLog by ERP Staff ID
const findByErpStaffIdforLogs = async (erpStaffId) => {
    try {
      const rows = await sql`
        SELECT * FROM faculty_logs WHERE erp_id = ${erpStaffId}
      `;
  
      if (!rows[0]) {
        console.log('No facultylog found with erpStaffId:', erpStaffId);
        return null;
      }
      
      return rows;
    } catch (error) {
      console.error('Error in findByErpStaffId:', error);
      throw error;
    }
  };

module.exports = {
    findByErpStaffIdforLogs
};