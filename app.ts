dotenv.config();

import express from 'express';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    const conn = await db.getConnection();
    console.log('MySQL database connected successfully!');
    conn.release();
  } catch (err) {
    console.error('MySQL connection error:', err);
  }
});
