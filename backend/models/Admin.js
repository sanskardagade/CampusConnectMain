const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');
const crypto = require('crypto');

// Map Admin DB row to JS object
const mapAdmin = (row) => {
  console.log('Mapping admin row:', row);
  return {
    id: row.id,
    erpid: row.erpid,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    passwordResetToken: row.password_reset_token,
    tokenExpiry: row.token_expiry,
    isActive: row.is_active,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

/**
 * Find admin record by ERP ID
 * @param {string|number} erpid
 */
const findByErp = async (erpid) => {
  console.log('Finding admin by ERP ID:', erpid);
  const rows = await sql`
    SELECT * FROM admin WHERE erpid = ${erpid} AND is_active = true LIMIT 1
  `;
  console.log('Database query result:', rows);
  if (!rows[0]) return null;
  return mapAdmin(rows[0]);
};

/**
 * Find admin by email
 * @param {string} email
 */
const findByEmail = async (email) => {
  const rows = await sql`
    SELECT * FROM admin WHERE email = ${email} AND is_active = true LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapAdmin(rows[0]);
};

/**
 * Create new admin
 */
const create = async ({
  erpid,
  name,
  email,
  password,
  startDate = new Date()
}) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await sql`
    INSERT INTO admin (
      erpid, name, email, password_hash, start_date
    ) VALUES (
      ${erpid}, ${name}, ${email}, ${passwordHash}, ${startDate}
    ) RETURNING *
  `;
  return mapAdmin(result[0]);
};

/**
 * Update admin
 */
const update = async (erpid, updateData) => {
  const result = await sql`
    UPDATE admin
    SET 
      name = COALESCE(${updateData.name}, name),
      email = COALESCE(${updateData.email}, email),
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapAdmin(result[0]) : null;
};

/**
 * Update password
 */
const updatePassword = async (erpid, newPassword) => {
  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await sql`
    UPDATE admin
    SET 
      password_hash = ${passwordHash},
      password_reset_token = NULL,
      token_expiry = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapAdmin(result[0]) : null;
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = async (erpid) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour from now

  const result = await sql`
    UPDATE admin
    SET 
      password_reset_token = ${token},
      token_expiry = ${expiry},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? { token, expiry } : null;
};

/**
 * Reset password using token
 */
const resetPassword = async (token, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await sql`
    UPDATE admin
    SET 
      password_hash = ${passwordHash},
      password_reset_token = NULL,
      token_expiry = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE password_reset_token = ${token} 
      AND token_expiry > CURRENT_TIMESTAMP
      AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapAdmin(result[0]) : null;
};

/**
 * Compare provided password with stored password
 */
const comparePassword = async (password, storedPassword) => {
  console.log('Comparing passwords...');
  console.log('Provided password:', password);
  console.log('Stored password:', storedPassword);
  
  if (!password || !storedPassword) {
    console.log('Missing password or stored password');
    return false;
  }
  // Use bcrypt for comparison
  return bcrypt.compare(password, storedPassword);
};

/**
 * Migrate plain text passwords to hashed passwords
 */
const migrateToHashedPasswords = async () => {
  try {
    // Get all admins with plain text passwords
    const rows = await sql`
      SELECT id, erpid, password_hash 
      FROM admin 
      WHERE password_hash IS NOT NULL
    `;
    for (const row of rows) {
      // Hash the existing password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(row.password_hash, salt);
      // Update with hashed password
      await sql`
        UPDATE admin
        SET password_hash = ${hashedPassword}
        WHERE id = ${row.id}
      `;
    }
    return true;
  } catch (error) {
    console.error('Error migrating passwords:', error);
    return false;
  }
};

/**
 * Deactivate admin
 */
const deactivate = async (erpid, endDate = new Date()) => {
  const result = await sql`
    UPDATE admin
    SET 
      is_active = false,
      end_date = ${endDate},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapAdmin(result[0]) : null;
};

module.exports = {
  findByErp,
  findByEmail,
  create,
  update,
  updatePassword,
  generatePasswordResetToken,
  resetPassword,
  comparePassword,
  deactivate,
  mapAdmin,
  migrateToHashedPasswords
}; 