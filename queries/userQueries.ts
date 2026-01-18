export const USER_BY_USERNAME_ACTIVE = 'SELECT id, phone FROM user WHERE username = ? AND status = ?';
export const USER_BY_EMAIL_ACTIVE = 'SELECT id, phone FROM user WHERE email = ? AND status = ?';
export const USER_BY_PHONE_ACTIVE = 'SELECT id FROM user WHERE phone = ? AND status = ?';
export const LOGIN_BY_USERID_ACTIVE = 'SELECT password FROM login WHERE user_id = ? AND status = ?';
export const LOGIN_UPDATE_PASSWORD = 'UPDATE login SET password = ? WHERE user_id = ? AND status = ?';
export const OTP_VALID_FOR_USER = 'SELECT id, expires_at, used FROM otp WHERE user_id = ? AND otp_code = ? AND used = FALSE';
export const OTP_MARK_USED = 'UPDATE otp SET used = TRUE WHERE id = ?';
export const OTP_INSERT = 'INSERT INTO otp (user_id, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?)';
export const OTP_INVALIDATE_PREVIOUS = 'UPDATE otp SET used = TRUE WHERE user_id = ? AND used = FALSE';
export const USER_SET_STATUS_INACTIVE = 'UPDATE user SET status = ? WHERE id = ?';
export const USER_DUPLICATE_CHECK = 'SELECT id, email, phone, username FROM user WHERE email = ? OR phone = ? OR username = ?';
export const ROLE_BY_ID_ACTIVE = 'SELECT id FROM role WHERE id = ? AND status = ?';
export const USERROLE_INSERT = 'INSERT INTO userrole (user_id, role_id, status, created_at) VALUES (?, ?, ?, ?)';
export const USER_SELECT_ALL = 'SELECT * FROM user';
export const USER_SELECT_BY_ID = 'SELECT * FROM user WHERE id = ?';
export const USER_INSERT = `INSERT INTO user (email, phone, country_code, username, firstname, lastname, gender, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

// Role queries
export const ROLE_SELECT_ALL = 'SELECT * FROM role WHERE status = ?';
export const ROLE_SELECT_BY_ID = 'SELECT * FROM role WHERE id = ? AND status = ?';
export const ROLE_INSERT = 'INSERT INTO role (name, status, created_at, created_by) VALUES (?, ?, ?, ?)';
export const ROLE_UPDATE = 'UPDATE role SET name = ?, updated_at = ?, updated_by = ? WHERE id = ? AND status = ?';
export const ROLE_DELETE = 'UPDATE role SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?';
export const ROLE_BY_NAME = 'SELECT id, name FROM role WHERE name = ? AND status = ?';

// User role queries
export const USERROLE_BY_USER_ID = 'SELECT ur.*, r.name as role_name FROM userrole ur JOIN role r ON ur.role_id = r.id WHERE ur.user_id = ? AND ur.status = ?';
export const USERROLE_BY_ROLE_ID = 'SELECT ur.*, u.username, u.email FROM userrole ur JOIN user u ON ur.user_id = u.id WHERE ur.role_id = ? AND ur.status = ?';
export const USERROLE_DELETE = 'UPDATE userrole SET status = ? WHERE user_id = ? AND role_id = ?';
