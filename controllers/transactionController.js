import Account from '../models/accounts.js';
import Transaction from '../models/transactions.js';
import { Op } from 'sequelize';

export const getTransactionHistory = async (req, res) => {
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
      order: [['createdat', 'DESC']]
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
        from_account_id: tx.from_account_id,
        to_account_id: tx.to_account_id
      };
    });

    res.json({ account_id: account.id, transactions: formatted });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};