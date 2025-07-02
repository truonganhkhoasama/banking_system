import Account from '../models/accounts.js';
import User from '../models/users.js';
import Transaction from '../models/transactions.js';
import { Op } from 'sequelize';

export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user.id;

    const account = await Account.findOne({ where: { user_id: userId } });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { from_account_id: account.id },
          { to_account_id: account.id }
        ]
      },
      order: [['createdat', 'DESC']],
      include: [
        {
          model: Account,
          as: 'from_account',
          include: [{ model: User, as: 'user' }]
        },
        {
          model: Account,
          as: 'to_account',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    // Gắn nhãn giao dịch theo hướng và loại
    const formatted = transactions.map((tx) => {
      let direction = '';
      let label = '';

      if (tx.type === 'transfer') {
        direction = tx.from_account_id === account.id ? 'sent' : 'received';
        label = direction === 'sent' ? 'Chuyển khoản' : 'Nhận tiền';
      } else if (tx.type === 'debt_pay') {
        direction = tx.from_account_id === account.id ? 'sent' : 'received';
        label = direction === 'sent' ? 'Thanh toán nhắc nợ' : 'Nhận thanh toán nhắc nợ';
      } else {
        label = 'Khác';
      }

      return {
        id: tx.id,
        type: tx.type,
        label,
        direction,
        amount: tx.amount,
        fee: tx.fee,
        fee_payer: tx.fee_payer,
        description: tx.description,
        timestamp: tx.createdAt,
        from: {
          account_number: tx.from_account?.account_number,
          name: tx.from_account?.user?.full_name
        },
        to: {
          account_number: tx.to_account?.account_number,
          name: tx.to_account?.user?.full_name
        }
      };
    });

    res.json({ account_id: account.id, transactions: formatted });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export async function getAccountTransactionHistory(req, res) {
  try {
    const { account_number } = req.params;

    const account = await Account.findOne({ where: { account_number } });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { from_account_id: account.id },
          { to_account_id: account.id }
        ]
      },
      order: [['createdat', 'DESC']],
      include: [
        {
          model: Account,
          as: 'from_account',
          include: [{ model: User, as: 'user' }]
        },
        {
          model: Account,
          as: 'to_account',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    const formatted = transactions.map((tx) => {
      let direction = '';
      let label = '';

      if (tx.type === 'transfer') {
        direction = tx.from_account_id === account.id ? 'sent' : 'received';
        label = direction === 'sent' ? 'Chuyển khoản' : 'Nhận tiền';
      } else if (tx.type === 'debt_pay') {
        direction = tx.from_account_id === account.id ? 'sent' : 'received';
        label = direction === 'sent' ? 'Thanh toán nhắc nợ' : 'Nhận thanh toán nhắc nợ';
      } else {
        label = 'Khác';
      }

      return {
        id: tx.id,
        type: tx.type,
        label,
        direction,
        amount: tx.amount,
        fee: tx.fee,
        fee_payer: tx.fee_payer,
        description: tx.description,
        timestamp: tx.createdat,
        from: {
          account_number: tx.from_account?.account_number,
          name: tx.from_account?.user?.full_name
        },
        to: {
          account_number: tx.to_account?.account_number,
          name: tx.to_account?.user?.full_name
        }
      };
    });

    res.json({
      account_number: account.account_number,
      account_id: account.id,
      transactions: formatted
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}