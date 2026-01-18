import type { Request, Response } from 'express';
import { db } from '../db.js';
import { getCurrentUnixTime } from '../utils/time.js';
import {
    ROLE_SELECT_ALL,
    ROLE_SELECT_BY_ID,
    ROLE_INSERT,
    ROLE_UPDATE,
    ROLE_DELETE,
    ROLE_BY_NAME,
    USERROLE_BY_USER_ID,
    USERROLE_BY_ROLE_ID,
    USERROLE_INSERT,
    USERROLE_DELETE
} from '../queries/userQueries.js';

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(ROLE_SELECT_ALL, ['active']);
        res.json({
            message: 'Roles retrieved successfully',
            data: rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve roles', details: err });
    }
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(ROLE_SELECT_BY_ID, [id, 'active']);
        const roleArr: any = rows as Array<any>;
        
        if (!roleArr.length) {
            return res.status(404).json({ error: 'Role not found' });
        }
        
        res.json({
            message: 'Role retrieved successfully',
            data: roleArr[0]
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve role', details: err });
    }
};

// Create new role
export const createRole = async (req: Request, res: Response) => {
    const { name } = req.body;
    const createdBy = req.user?.userId; // From JWT middleware
    
    if (!name) {
        return res.status(400).json({ error: 'Role name is required' });
    }
    
    try {
        // Check if role already exists
        const [existingRoles] = await db.query(ROLE_BY_NAME, [name, 'active']);
        const existingRoleArr: any = existingRoles as Array<any>;
        
        if (existingRoleArr.length) {
            return res.status(409).json({ error: 'Role with this name already exists' });
        }
        
        const currentTime = getCurrentUnixTime();
        
        const [result] = await db.query(ROLE_INSERT, [
            name,
            'active',
            currentTime,
            createdBy || null
        ]);
        
        const insertResult: any = result;
        const roleId = insertResult.insertId;
        
        res.status(201).json({
            message: 'Role created successfully',
            data: {
                id: roleId,
                name,
                status: 'active',
                created_at: currentTime,
                created_by: createdBy
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create role', details: err });
    }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const updatedBy = req.user?.userId; // From JWT middleware
    
    if (!name) {
        return res.status(400).json({ error: 'Role name is required' });
    }
    
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Valid role ID is required' });
    }
    
    try {
        // Check if role exists
        const [existingRoles] = await db.query(ROLE_SELECT_BY_ID, [id, 'active']);
        const existingRoleArr: any = existingRoles as Array<any>;
        
        if (!existingRoleArr.length) {
            return res.status(404).json({ error: 'Role not found' });
        }
        
        // Check if another role with the same name exists
        const [duplicateRoles] = await db.query(ROLE_BY_NAME, [name, 'active']);
        const duplicateRoleArr: any = duplicateRoles as Array<any>;
        
        if (duplicateRoleArr.length && duplicateRoleArr[0].id !== parseInt(id)) {
            return res.status(409).json({ error: 'Role with this name already exists' });
        }
        
        const currentTime = getCurrentUnixTime();
        
        await db.query(ROLE_UPDATE, [
            name,
            currentTime,
            updatedBy || null,
            id,
            'active'
        ]);
        
        res.json({
            message: 'Role updated successfully',
            data: {
                id: parseInt(id),
                name,
                updated_at: currentTime,
                updated_by: updatedBy
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update role', details: err });
    }
};

// Delete role (soft delete)
export const deleteRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedBy = req.user?.userId; // From JWT middleware
    
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Valid role ID is required' });
    }
    
    try {
        // Check if role exists
        const [existingRoles] = await db.query(ROLE_SELECT_BY_ID, [id, 'active']);
        const existingRoleArr: any = existingRoles as Array<any>;
        
        if (!existingRoleArr.length) {
            return res.status(404).json({ error: 'Role not found' });
        }
        
        const currentTime = getCurrentUnixTime();
        
        await db.query(ROLE_DELETE, [
            'inactive',
            currentTime,
            updatedBy || null,
            id
        ]);
        
        res.json({
            message: 'Role deleted successfully',
            data: {
                id: parseInt(id),
                status: 'inactive',
                updated_at: currentTime,
                updated_by: updatedBy
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete role', details: err });
    }
};

