import Account from '../models/accounts.js';
import OtpCode from '../models/otp_codes.js';
import Transaction from '../models/transactions.js';
import User from '../models/users.js';
import sendOtpToEmail from '../utils/email.js';
import { generateOtpCode } from '../utils/otp.js';
import { Op } from 'sequelize';
import { sequelize } from '../db.js'

const TRANSFER_FEE = 1.00;

export const initiateTransfer = async (req, res) => {
  try {
    const { to_account_number, amount, message, fee_payer } = req.body;
    const userId = req.user.id;

    // Validate accounts
    const fromAccount = await Account.findOne({ where: { user_id: userId } });
    const toAccount = await Account.findOne({ where: { account_number: to_account_number } });

    if (!fromAccount || !toAccount) {
      return res.status(400).json({ message: 'Invalid account(s)' });
    }

    if (fromAccount.id === toAccount.id) {
      return res.status(400).json({ message: 'Cannot transfer to self' });
    }

    const totalAmount = fee_payer === 'sender' ? amount + TRANSFER_FEE : amount;

    if (fromAccount.balance < totalAmount) {
      return res.status(400).json({ message: 'Insufficient balance to cover amount and fee' });
    }

    // Generate OTP
    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await OtpCode.create({
      user_id: userId,
      code: otp,
      type: 'transfer',
      expires_at: expiresAt
    });

    const user = await User.findByPk(userId);
    await sendOtpToEmail(user.email, otp);

    return res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const confirmTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { to_account_number, amount, otp_code, message, fee_payer } = req.body;

    if (!['sender', 'receiver'].includes(fee_payer)) {
      return res.status(400).json({ message: 'Invalid fee payer' });
    }

    const otp = await OtpCode.findOne({
      where: {
        user_id: userId,
        code: otp_code.toString(),
        type: 'transfer',
        is_used: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const fromAccount = await Account.findOne({ where: { user_id: userId } });
    const toAccount = await Account.findOne({ where: { account_number: to_account_number } });

    if (!fromAccount || !toAccount) {
      return res.status(400).json({ message: 'Invalid account(s)' });
    }

    const fee = TRANSFER_FEE;
    const totalDeduct = fee_payer === 'sender' ? amount + fee : amount;

    if (fromAccount.balance < totalDeduct) {
      return res.status(400).json({ message: 'Insufficient balance for transfer and fee' });
    }

    await sequelize.transaction(async (t) => {
      // Cập nhật số dư
      await fromAccount.update(
        { balance: fromAccount.balance - totalDeduct },
        { transaction: t }
      );

      const receivedAmount = fee_payer === 'receiver' ? amount - fee : amount;

      await toAccount.update(
        { balance: parseFloat(toAccount.balance) + receivedAmount },
        { transaction: t }
      );

      // Ghi log giao dịch
      await Transaction.create(
        {
          from_account_id: fromAccount.id,
          to_account_id: toAccount.id,
          amount,
          fee,
          fee_payer,
          type: 'transfer',
          description: message || 'Internal transfer',
          status: 'success'
        },
        { transaction: t }
      );

      // Đánh dấu OTP đã dùng
      await otp.update({ is_used: true }, { transaction: t });
    });

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    console.error('Error confirming transfer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
