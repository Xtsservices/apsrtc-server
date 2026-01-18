import express from 'express';
import dotenv from 'dotenv';
import { db } from './db.js';
import { createTables } from './schema.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    const conn = await db.getConnection();
    console.log('MySQL database connected successfully!');
    conn.release();
    await createTables();
  // Ensure default admin user and role
  const { ensureDefaultAdmin } = await import('./bootstrap.js');
  await ensureDefaultAdmin();
  } catch (err) {
    console.error('MySQL connection error:', err);
  }
});
