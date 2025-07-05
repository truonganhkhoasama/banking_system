import Account from '../models/accounts.js';
import OtpCode from '../models/otp_codes.js';
import Transaction from '../models/transactions.js';
import User from '../models/users.js';
import { sendOtpToEmail } from '../utils/email.js';
import { generateOtpCode } from '../utils/otp.js';
import { Op } from 'sequelize';
import { sequelize } from '../db.js'

const TRANSFER_FEE = 1.00;

const OTP_EXPIRY_MINUTES = 5;

export const initiateTransfer = async (req, res) => {
  try {
    const { to_account_number, amount, message, fee_payer } = req.body;
    const userId = req.user.id;

    const fromAccount = await Account.findOne({ where: { user_id: userId } });
    const toAccount = await Account.findOne({ where: { account_number: to_account_number } });

    if (!fromAccount || !toAccount) {
      return res.status(400).json({ message: 'Invalid account(s)' });
    }

    if (fromAccount.id === toAccount.id) {
      return res.status(400).json({ message: 'Cannot transfer to self' });
    }

    const fee = TRANSFER_FEE;
    const totalAmount = fee_payer === 'sender' ? amount + fee : amount;

    if (fromAccount.balance < totalAmount) {
      return res.status(400).json({ message: 'Insufficient balance to cover amount and fee' });
    }

    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OtpCode.create({
      user_id: userId,
      code: otp,
      type: 'transfer',
      expires_at: expiresAt,
    });

    const user = await User.findByPk(userId);
    await sendOtpToEmail(user.email, otp);

    return res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const confirmTransfer = async (req, res) => {
  try {
    const { to_account_number, amount, otp_code, message, fee_payer } = req.body;
    const userId = req.user.id;

    const otp = await OtpCode.findOne({
      where: {
        user_id: userId,
        code: otp_code.toString(),
        type: 'transfer',
        is_used: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const fromAccount = await Account.findOne({ where: { user_id: userId } });
    const toAccount = await Account.findOne({ where: { account_number: to_account_number } });

    if (!fromAccount || !toAccount) {
      return res.status(400).json({ message: 'Invalid account(s)' });
    }

    const fee = TRANSFER_FEE;
    const totalDeduct = fee_payer === 'sender' ? amount + fee : amount;
    const amountReceived = fee_payer === 'receiver' ? amount - fee : amount;

    if (fromAccount.balance < totalDeduct) {
      return res.status(400).json({ message: 'Insufficient balance for transfer and fee' });
    }

    await sequelize.transaction(async (t) => {
      await fromAccount.update(
        { balance: fromAccount.balance - totalDeduct },
        { transaction: t }
      );

      await toAccount.update(
        { balance: toAccount.balance + amountReceived },
        { transaction: t }
      );

      await Transaction.create(
        {
          from_account_id: fromAccount.id,
          to_account_id: toAccount.id,
          amount,
          fee,
          fee_payer,
          type: 'transfer',
          description: message || 'Internal transfer',
          status: 'success',
        },
        { transaction: t }
      );

      await otp.update({ is_used: true }, { transaction: t });
    });

    return res.json({ message: 'Transfer successful' });
  } catch (error) {
    console.error('Error confirming transfer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
