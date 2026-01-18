import type { PoolConnection } from 'mysql2/promise';
import { USER_DUPLICATE_CHECK } from '../queries/userQueries.js';

export async function checkUserDuplicates(conn: PoolConnection, email: string, phone: string, username: string) {
  const [dupRows] = await conn.query(USER_DUPLICATE_CHECK, [email, phone, username]);
  const dupArr = dupRows as Array<{ id: number; email: string; phone: string; username: string }>;
  return dupArr.length > 0;
}
