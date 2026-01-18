import { db } from './db.js';
import { hashPassword } from './utils/password.js';
import { getCurrentUnixTime } from './utils/time.js';

export async function ensureDefaultAdmin() {
  // Create default role and user
  try {
    const [roleResult] = await db.query(`INSERT IGNORE INTO role (name, status, created_at) VALUES (?, ?, ?);`, ['admin', 'active', getCurrentUnixTime()]);
    const [userResult] = await db.query(`INSERT IGNORE INTO user (email, phone, country_code, username, firstname, lastname, gender, phone_verified, email_verified, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [
      'admin@example.com', '1234567890', '+91', 'admin', 'Admin', 'User', 'male', true, true, 'active', getCurrentUnixTime()
    ]);
    // Get user and role IDs
    const [userRows] = await db.query(`SELECT id FROM user WHERE username = ?`, ['admin']);
    const [roleRows] = await db.query(`SELECT id FROM role WHERE name = ?`, ['admin']);
    const userArr = userRows as Array<{ id: number }>;
    const roleArr = roleRows as Array<{ id: number }>;
    const user = userArr[0];
    const role = roleArr[0];
    if (user && role) {
      // Check if userrole already exists
      const [userRoleRows] = await db.query(`SELECT id FROM userrole WHERE user_id = ? AND role_id = ?`, [user.id, role.id]);
      const userRoleArr = userRoleRows as Array<{ id: number }>; 
      if (!userRoleArr.length) {
        await db.query(`INSERT INTO userrole (user_id, role_id, status, created_at) VALUES (?, ?, ?, ?);`, [user.id, role.id, 'active', getCurrentUnixTime()]);
        console.log('Default admin user and role created/ensured.');
      } else {
        console.log('Admin user already has admin role.');
      }

      // Insert temp encrypted password into login table for admin
      const tempPassword = 'admin@123';
      const encryptedPassword = await hashPassword(tempPassword);
      // Check if login already exists for this user
      const [loginRows] = await db.query(`SELECT id FROM login WHERE user_id = ?`, [user.id]);
      const loginArr = loginRows as Array<{ id: number }>; 
      if (!loginArr.length) {
        await db.query(`INSERT INTO login (user_id, password, status, created_at) VALUES (?, ?, ?, ?);`, [user.id, encryptedPassword, 'active', getCurrentUnixTime()]);
        console.log('Admin login created with temp password.');
      } else {
        console.log('Admin login already exists.');
      }
    }
  } catch (err) {
    console.error('Error creating default user/role:', err);
  }
}
