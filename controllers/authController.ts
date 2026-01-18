import type { Request, Response } from 'express';
import { db } from '../db.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateOTP, getOTPExpiryTime, sendOTP, sendSMS } from '../utils/otp.js';
import { getCurrentUnixTime, isUnixTimeExpired } from '../utils/time.js';
import { generateToken } from '../utils/jwt.js';
import {
    USER_BY_USERNAME_ACTIVE,
    USER_BY_EMAIL_ACTIVE,
    USER_BY_PHONE_ACTIVE,
    LOGIN_BY_USERID_ACTIVE,
    LOGIN_UPDATE_PASSWORD,
    OTP_VALID_FOR_USER,
    OTP_MARK_USED,
    OTP_INSERT,
    OTP_INVALIDATE_PREVIOUS
} from '../queries/userQueries.js';

export const login = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    try {
        // Find user by username or email
        let userRows;
        if (username) {
            [userRows] = await db.query(USER_BY_USERNAME_ACTIVE, [username, 'active']);
        } else if (email) {
            [userRows] = await db.query(USER_BY_EMAIL_ACTIVE, [email, 'active']);
        } else {
            return res.status(400).json({ error: 'Username or email is required' });
        }
        const userArr: any = userRows as Array<{ id: number; phone: string; username: string; email: string }>;
        if (!userArr.length) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = userArr[0];
        const userId = user.id;
        
        // Get login record for user
        const [loginRows] = await db.query(LOGIN_BY_USERID_ACTIVE, [userId, 'active']);
        const loginArr: any = loginRows as Array<{ password: string }>;
        if (!loginArr.length) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await comparePassword(password, loginArr[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone
        };
        const token = generateToken(tokenPayload);
        
        // Success
        res.json({ 
            message: 'Login successful', 
            userId,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone.replace(/(\d{2})(\d{4})(\d+)/, '$1****$3') // Masked phone
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err });
    }
};

export const loginWithPhoneOtp = async (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        // Find user by phone
        const [userRows] = await db.query(USER_BY_PHONE_ACTIVE, [phone, 'active']);
        const userArr: any = userRows as Array<{ id: number }>;
        if (!userArr.length) {
            return res.status(404).json({ error: 'User not found with this phone number' });
        }
        const userId = userArr[0].id;

        const otpCode = generateOTP();
        const expiresAt = getOTPExpiryTime();
        const currentTime = getCurrentUnixTime();

        try {
            // Start transaction
            await db.execute('START TRANSACTION');

            // Invalidate all previous OTPs for this user
            await db.query(OTP_INVALIDATE_PREVIOUS, [userId]);

            // Insert new OTP
            await db.query(OTP_INSERT, [userId, otpCode, expiresAt, currentTime]);

            // Send OTP via SMS
            const otpSent = await sendOTP(phone, otpCode);

            if (!otpSent) {
                await db.execute('ROLLBACK');
                return res.status(500).json({ error: 'Failed to send OTP' });
            }

            await db.execute('COMMIT');

            return res.json({
                message: 'OTP sent successfully for login',
                userId,
                expiresInMinutes: 5
            });

        } catch (error) {
            await db.execute('ROLLBACK');
            throw error;
        }

    } catch (err) {
        res.status(500).json({ error: 'Failed to send OTP for login', details: err });
    }
};



export const generateOtp = async (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        // Find user by phone
        const [userRows] = await db.query(USER_BY_PHONE_ACTIVE, [phone, 'active']);
        const userArr: any = userRows as Array<{ id: number }>;
        if (!userArr.length) {
            return res.status(404).json({ error: 'User not found with this phone number' });
        }
        const userId = userArr[0].id;

        const otpCode = generateOTP();
        const expiresAt = getOTPExpiryTime();
        const currentTime = getCurrentUnixTime();

        try {
            // Start transaction
            await db.execute('START TRANSACTION');

            // Set all existing active OTPs as inactive/used for this user
            await db.query(OTP_INVALIDATE_PREVIOUS, [userId]);

            // Insert new OTP
            await db.query(OTP_INSERT, [userId, otpCode, expiresAt, currentTime]);

            // Send OTP via SMS
            const otpSent = await sendOTP(phone, otpCode);

            if (!otpSent) {
                await db.execute('ROLLBACK');
                return res.status(500).json({ error: 'Failed to send OTP' });
            }

            await db.execute('COMMIT');

            return res.json({
                message: 'New OTP generated and sent successfully',
                userId,
                expiresInMinutes: 5,
                note: 'Previous OTPs have been invalidated'
            });

        } catch (error) {
            await db.execute('ROLLBACK');
            throw error;
        }

    } catch (err) {
        res.status(500).json({ error: 'Failed to regenerate OTP', details: err });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    try {
        // Find user by phone
        const [userRows] = await db.query(USER_BY_PHONE_ACTIVE, [phone, 'active']);
        const userArr: any = userRows as Array<{ id: number; username: string; email: string; phone: string }>;
        if (!userArr.length) {
            return res.status(404).json({ error: 'User not found with this phone number' });
        }
        const user = userArr[0];
        const userId = user.id;

        // Find valid OTP for user
        const [otpRows] = await db.query(OTP_VALID_FOR_USER, [userId, otp]);
        const otpArr = otpRows as Array<{ id: number; expires_at: string; used: boolean }>;
        if (!otpArr.length) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        const otpRecord: any = otpArr[0];

        // Check if OTP is expired (compare unix timestamps)
        if (isUnixTimeExpired(parseInt(otpRecord.expires_at))) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        // Mark OTP as used
        await db.query(OTP_MARK_USED, [otpRecord.id]);

        // Generate JWT token
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone
        };
        const token = generateToken(tokenPayload);

        // Success - phone and OTP verified, user is authenticated
        return res.json({ 
            message: 'Phone and OTP verified successfully. Login successful', 
            userId,
            token,
            isVerified: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone.replace(/(\d{2})(\d{4})(\d+)/, '$1****$3') // Masked phone
            }
        });

    } catch (err) {
        res.status(500).json({ error: 'Phone and OTP verification failed', details: err });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { username, email } = req.body;

    if (!username && !email) {
        return res.status(400).json({ error: 'Username or email is required' });
    }

    try {
        // Find user by username or email
        let userRows;
        if (username) {
            [userRows] = await db.query(USER_BY_USERNAME_ACTIVE, [username, 'active']);
        } else if (email) {
            [userRows] = await db.query(USER_BY_EMAIL_ACTIVE, [email, 'active']);
        }
        
        const userArr: any = userRows as Array<{ id: number; phone: string }>;
        if (!userArr.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userArr[0].id;
        const userPhone = userArr[0].phone;

        // Generate random password (8 characters: mix of letters and numbers)
        const randomPassword = Math.random().toString(36).slice(-8);

        try {
            // Start transaction
            await db.execute('START TRANSACTION');

            // Hash the random password
            const hashedPassword = await hashPassword(randomPassword);

            // Update password in login table directly
            await db.query(LOGIN_UPDATE_PASSWORD, [hashedPassword, userId, 'active']);

            // Send new password via SMS
            const passwordSent = await sendSMS(userPhone, `Your new password is: ${randomPassword}`);

            if (!passwordSent) {
                await db.execute('ROLLBACK');
                return res.status(500).json({ error: 'Failed to send new password' });
            }

            await db.execute('COMMIT');

            return res.json({
                message: 'New password generated and sent to your registered phone',
                userId,
                phone: userPhone.replace(/(\d{2})(\d{4})(\d+)/, '$1****$3'), // Masked phone for security
                note: 'Please change your password after login for security'
            });

        } catch (error) {
            await db.execute('ROLLBACK');
            throw error;
        }

    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password', details: err });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { username, email, newPassword } = req.body;

    if ((!username && !email) || !newPassword) {
        return res.status(400).json({ error: 'Username or email, and new password are required' });
    }

    try {
        // Find user by username or email
        let userRows;
        if (username) {
            [userRows] = await db.query(USER_BY_USERNAME_ACTIVE, [username, 'active']);
        } else if (email) {
            [userRows] = await db.query(USER_BY_EMAIL_ACTIVE, [email, 'active']);
        }
        
        const userArr: any = userRows as Array<{ id: number; phone: string }>;
        if (!userArr.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userArr[0].id;
        const userPhone = userArr[0].phone;

        try {
            // Start transaction
            await db.execute('START TRANSACTION');

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password in login table directly
            await db.query(LOGIN_UPDATE_PASSWORD, [hashedPassword, userId, 'active']);

            // Send confirmation via SMS
            const confirmationSent = await sendSMS(userPhone, `Your password has been successfully reset for your account.`);

            if (!confirmationSent) {
                await db.execute('ROLLBACK');
                return res.status(500).json({ error: 'Password updated but failed to send confirmation' });
            }

            await db.execute('COMMIT');

            return res.json({
                message: 'Password reset successfully',
                userId,
                phone: userPhone.replace(/(\d{2})(\d{4})(\d+)/, '$1****$3'), // Masked phone for security
                note: 'Confirmation sent to your registered phone'
            });

        } catch (error) {
            await db.execute('ROLLBACK');
            throw error;
        }

    } catch (err) {
        res.status(500).json({ error: 'Password reset failed', details: err });
    }
};
