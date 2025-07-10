import DebtReminder from '../models/debt_reminders.js';
import { Op } from 'sequelize';
import User from '../models/users.js'; // or adjust the import path to your actual model
import OtpCode from '../models/otp_codes.js';
import Account from '../models/accounts.js';
import { generateOtpCode } from '../utils/otp.js';
import { sendEmail, sendOtpToEmail } from '../utils/email.js';
import Transaction from '../models/transactions.js';
import { sequelize } from '../db.js'


const TRANSFER_FEE = 5000.00;

export async function createDebtReminder(req, res) {
  try {
    const { to_account_number, amount, description } = req.body;

    const recipientAccount = await Account.findOne({
      where: { account_number: to_account_number },
    });

    if (!recipientAccount) {
      return res.status(404).json({ error: 'Recipient account not found' });
    }

    // Prevent self-reminding
    if (recipientAccount.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot send a debt reminder to yourself' });
    }

    const reminder = await DebtReminder.create({
      from_user_id: req.user.id,
      to_user_id: recipientAccount.user_id,
      amount,
      description
    });

    const recipientUser = await User.findByPk(recipientAccount.user_id);
    const user = await User.findByPk(req.user.id);

    if (recipientUser?.email) {
      const emailMessage = `You have received a debt reminder of ${amount} from ${user.full_name}.\n\nDescription: ${description}`;
      await sendEmail(recipientUser.email, emailMessage, 'New Debt Reminder');
    }

    res.status(201).json(reminder);
  } catch (err) {
    console.error('Error creating debt reminder:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllDebtReminders(req, res) {
  try {
    const reminders = await DebtReminder.findAll({
      where: {
        [Op.or]: [
          { from_user_id: req.user.id },
          { to_user_id: req.user.id },
        ]
      },
      include: [
        {
          model: User,
          as: 'from_user',
          attributes: ['full_name', 'email'], // customize fields
        },
        {
          model: User,
          as: 'to_user',
          attributes: ['full_name', 'email'],
        },
      ],
      order: [['createdat', 'DESC']],
    });

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteDebtReminder(req, res) {
  try {
    const { reason } = req.body;

    const reminder = await DebtReminder.findByPk(req.params.id, {
      include: [
        { model: User, as: 'from_user', attributes: ['id', 'email', 'full_name'] },
        { model: User, as: 'to_user', attributes: ['id', 'email', 'full_name'] }
      ]
    });

    if (!reminder) return res.status(404).json({ error: 'Not found' });

    if (reminder.status !== 'pending')
      return res.status(400).json({ error: 'Cannot cancel non-pending reminder' });

    const currentUserId = req.user.id;

    if (
      reminder.from_user_id !== currentUserId &&
      reminder.to_user_id !== currentUserId
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    reminder.status = 'cancelled';
    await reminder.save();

    let recipient = null;
    let message = '';

    if (reminder.from_user_id === currentUserId) {
      // notify debtor
      recipient = reminder.to_user;
      message = `${reminder.from_user.full_name} has cancelled a debt reminder sent to you for ${reminder.amount}.\nReason: ${reason}`;
    } else {
      // notify creator
      recipient = reminder.from_user;
      message = `${reminder.to_user.full_name} has cancelled the debt reminder you sent for ${reminder.amount}.\nReason: ${reason}`;
    }

    if (recipient?.email) {
      try {
        await sendEmail(recipient.email, message);
      } catch (emailErr) {
        console.error(`Failed to send notification:`, emailErr);
      }
    }

    res.json({ message: 'Reminder cancelled and notification sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function initiateDebtPayment(req, res) {
  try {
    const userId = req.user.id;
    const { id: reminder_id } = req.params;

    const reminder = await DebtReminder.findByPk(reminder_id);

    if (!reminder || reminder.to_user_id !== userId)
      return res.status(403).json({ message: 'Not allowed to pay this reminder' });

    if (reminder.status !== 'pending')
      return res.status(400).json({ message: 'Debt already processed' });

    const fromAccount = await Account.findOne({ where: { user_id: userId } });
    if (!fromAccount)
      return res.status(400).json({ message: 'Your account not found' });

    const total = parseFloat(reminder.amount) + TRANSFER_FEE;
    if (fromAccount.balance < total)
      return res.status(400).json({ message: 'Insufficient balance' });

    // Generate OTP
    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OtpCode.create({
      user_id: userId,
      code: otp,
      type: 'debt_payment',
      expires_at: expiresAt,
    });

    const user = await User.findByPk(userId);
    await sendOtpToEmail(user.email, otp);

    return res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error in initiateDebtPayment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const confirmDebtPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: reminder_id } = req.params;
    const { otp_code } = req.body;

    const reminder = await DebtReminder.findByPk(reminder_id);
    if (!reminder || reminder.to_user_id !== userId)
      return res.status(403).json({ message: 'Not allowed to pay this reminder' });

    if (reminder.status !== 'pending')
      return res.status(400).json({ message: 'This debt is already processed' });

    const otp = await OtpCode.findOne({
      where: {
        user_id: userId,
        code: otp_code.toString(),
        type: 'debt_payment',
        is_used: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!otp)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    const fromAccount = await Account.findOne({ where: { user_id: userId } });
    const toAccount = await Account.findOne({ where: { user_id: reminder.from_user_id } });

    if (!fromAccount || !toAccount)
      return res.status(400).json({ message: 'Invalid accounts involved' });

    const fee = TRANSFER_FEE;
    const amount = parseFloat(reminder.amount);
    const total = amount + fee;


    if (fromAccount.balance < total)
      return res.status(400).json({ message: 'Insufficient balance to pay debt and fee' });

    await sequelize.transaction(async (t) => {
      // Update balances
      await fromAccount.update(
        { balance: fromAccount.balance - total },
        { transaction: t }
      );

      await toAccount.update(
        { balance: parseFloat(toAccount.balance) + amount },
        { transaction: t }
      );

      // Mark reminder as paid
      await reminder.update({ status: 'paid' }, { transaction: t });

      // Mark OTP as used
      await otp.update({ is_used: true }, { transaction: t });

      // Create transaction log
      await Transaction.create(
        {
          from_account_id: fromAccount.id,
          to_account_id: toAccount.id,
          amount: parseFloat(reminder.amount),
          fee,
          fee_payer: 'sender',
          type: 'debt_pay',
          description: reminder.description || 'Debt payment',
          status: 'success',
        },
        { transaction: t }
      );
    });

    return res.json({ message: 'Debt payment successful' });
  } catch (error) {
    console.error('Error in confirmDebtPayment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};