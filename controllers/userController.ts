import type { Request, Response } from 'express';
import { db } from '../db.js';
import { USER_SELECT_ALL, USER_SELECT_BY_ID, USER_INSERT, USERROLE_INSERT, ROLE_BY_ID_ACTIVE, USER_SET_STATUS_INACTIVE } from '../queries/userQueries.js';
import { checkUserDuplicates } from '../utils/userValidation.js';
import { getCurrentUnixTime } from '../utils/time.js';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(USER_SELECT_ALL);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users', details: err });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(USER_SELECT_BY_ID, [id]);
        if (Array.isArray(rows) && rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user', details: err });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { email, phone, country_code, username, firstname, lastname, gender, roleId } = req.body;
        // Check for duplicate email, phone, or username
        const hasDuplicate = await checkUserDuplicates(conn, email, phone, username);
        if (hasDuplicate) {
            await conn.rollback();
            return res.status(409).json({ error: 'Email, phone, or username already exists' });
        }
        // Check if role exists and is active by id
        const [roleRows] = await conn.query(ROLE_BY_ID_ACTIVE, [roleId, 'active']);
        const roleArr = roleRows as Array<{ id: number }>;
        if (!roleArr.length) {
            await conn.rollback();
            return res.status(400).json({ error: 'Role does not exist or is not active' });
        }
        // Insert user
        const [result] = await conn.query(
            USER_INSERT,
            [email, phone, country_code, username, firstname, lastname, gender, getCurrentUnixTime()]
        );
        const userId = (result as any).insertId;
        // Insert userrole
        await conn.query(USERROLE_INSERT, [userId, roleId, 'active', getCurrentUnixTime()]);
        await conn.commit();
        res.status(201).json({ id: userId });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: 'Failed to create user', details: err });
    } finally {
        conn.release();
    }
};
export const setUserInactive = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(USER_SET_STATUS_INACTIVE, ['inactive', id]);
        if ((result as any).affectedRows > 0) {
            res.json({ message: 'User status set to inactive.' });
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user status', details: err });
    }
};