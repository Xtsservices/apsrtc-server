import { db } from './db.js';

export async function createTables() {

  await db.query(`
    CREATE TABLE IF NOT EXISTS user (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(20) UNIQUE,
      country_code VARCHAR(10),
      username VARCHAR(255) NOT NULL,
      firstname VARCHAR(100),
      lastname VARCHAR(100),
      gender ENUM('male', 'female', 'other'),
      phone_verified BOOLEAN DEFAULT FALSE,
      email_verified BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'active',
      created_at BIGINT,
      updated_at BIGINT,
      created_by INT NULL,
      updated_by INT NULL,
      FOREIGN KEY (created_by) REFERENCES user(id),
      FOREIGN KEY (updated_by) REFERENCES user(id)
    );
  `);
  

  await db.query(`
    CREATE TABLE IF NOT EXISTS role (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      status VARCHAR(50) DEFAULT 'active',
      created_at BIGINT,
      updated_at BIGINT,
      created_by INT NULL,
      updated_by INT NULL,
      FOREIGN KEY (created_by) REFERENCES user(id),
      FOREIGN KEY (updated_by) REFERENCES user(id)
    );
  `);
    await db.query(`
    CREATE TABLE IF NOT EXISTS userrole (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at BIGINT,
      updated_at BIGINT,
      created_by INT NULL,
      updated_by INT NULL,
      UNIQUE KEY unique_user_role (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (role_id) REFERENCES role(id),
      FOREIGN KEY (created_by) REFERENCES user(id),
      FOREIGN KEY (updated_by) REFERENCES user(id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS login (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      password VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at BIGINT,
      updated_at BIGINT,
      created_by INT NULL,
      updated_by INT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (created_by) REFERENCES user(id),
      FOREIGN KEY (updated_by) REFERENCES user(id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS otp (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      otp_code VARCHAR(10),
      expires_at DATETIME,
      used BOOLEAN DEFAULT FALSE,
      status VARCHAR(50) DEFAULT 'active',
      created_at BIGINT,
      updated_at BIGINT,
      created_by INT NULL,
      updated_by INT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (created_by) REFERENCES user(id),
      FOREIGN KEY (updated_by) REFERENCES user(id)
    );
  `);

  console.log('All tables created or already exist.');
}
