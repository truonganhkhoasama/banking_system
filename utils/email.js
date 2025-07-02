import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = createTransport({
  service: 'gmail', // or use 'smtp.mailtrap.io', 'Outlook365', etc.
  auth: {
    user: process.env.EMAIL_USERNAME, // your Gmail address
    pass: process.env.EMAIL_PASSWORD  // app-specific password or SMTP pass
  }
});

/**
 * Send OTP or general message to email
 * @param {string} to - Recipient email
 * @param {string} code - OTP code
 * @returns {Promise}
 */
async function sendOtpToEmail(to, code) {
  const mailOptions = {
    from: `"Your Bank" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${code}. It will expire in 5 minutes.`,
    html: `<p>Your OTP code is: <strong>${code}</strong>.</p><p>This code will expire in 5 minutes.</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}: ${info.response}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${to}:`, error);
    throw new Error('Failed to send OTP email');
  }
}

export default sendOtpToEmail;
