import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/users.js'; // or adjust the import path to your actual model
import Account from '../models/accounts.js';
import { verifyRecaptcha } from '../utils/verifyRecaptcha.js';
import { loginSchema, createUserSchema } from '../schemas/authSchemas.js';
import generateAccountNumber from '../utils/generateAccountNumber.js';
import { Op } from 'sequelize';


export async function login(req, res) {
  try {
    const { username, password, recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token is missing' });
    }

    // 🔒 Step 1: Verify reCAPTCHA token with Google
    const data = await verifyRecaptcha(recaptchaToken);

    if (!data.success) {
      return res.status(403).json({ error: 'Failed reCAPTCHA verification' });
    }

    // 🔑 Step 2: Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: 'Invalid username or password' });

    // 🔐 Step 3: Compare password
    const match = await compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid username or password' });

    // 🪪 Step 4: Generate JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '1d' }
    );

    const { password: _, ...userData } = user.toJSON();
    res.json({ message: 'Login successful', accessToken, refreshToken, user: userData });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
}

export function refreshToken(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const newAccessToken = jwt.sign(
      { id: payload.id, email: payload.email, role: payload.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN } // e.g. 15m
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function createUser(req, res) {
  try {
    const { username, full_name, email, password, role } = req.body;

    if (!username || !email || !password || !role || !full_name) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already in use' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await hash(password, 10);
    const newUser = await User.create({
      username,
      full_name,
      email,
      password: hashedPassword,
      role
    });

    if (role === 'customer') {
      const accountNumber = (await generateAccountNumber()).toString(); // custom function to generate unique number
      await Account.create({
        user_id: newUser.id,
        account_number: accountNumber
      });
    }

    const { password: _, ...userData } = newUser.toJSON();
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

import { changePasswordSchema } from '../schemas/authSchemas.js';

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Old password is incorrect' });

    const isSame = await compare(newPassword, user.password);
    if (isSame) return res.status(400).json({ error: 'New password must be different' });

    const hashed = await hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


import OtpCode from '../models/otp_codes.js';
import { generateOtpCode } from '../utils/otp.js';
import { sendOtpToEmail } from '../utils/email.js';

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    // Clean up old OTPs
    await OtpCode.destroy({
      where: { user_id: user.id, type: 'forgot_pass', is_used: false }
    });

    const otp = generateOtpCode(); // e.g. 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await OtpCode.create({
      user_id: user.id,
      code: otp,
      type: 'forgot_pass',
      expires_at: expiresAt
    });

    await sendOtpToEmail(user.email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Request Password Reset Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const confirmPasswordReset = async (req, res) => {
  try {
    const { email, otp_code, new_password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const otp = await OtpCode.findOne({
      where: {
        user_id: user.id,
        code: otp_code.toString(),
        type: 'forgot_pass',
        is_used: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashedPassword = await hash(new_password, 10);
    await user.update({ password: hashedPassword });
    await otp.update({ is_used: true });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Confirm Password Reset Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};