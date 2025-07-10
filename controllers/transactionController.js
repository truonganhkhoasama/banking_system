import Account from '../models/accounts.js';
import User from '../models/users.js';
import Transaction from '../models/transactions.js';
import LinkedBank from '../models/linked_banks.js';
import InterbankTransaction from '../models/interbank_transactions.js';
import { Op } from 'sequelize';
import moment from 'moment';


export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });


    const account = await Account.findOne({ where: { user_id: userId } });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Fetch internal transactions
    const internalTxs = await Transaction.findAll({
      where: {
        [Op.or]: [
          { from_account_id: account.id },
          { to_account_id: account.id }
        ]
      },
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

    const formattedInternal = internalTxs.map((tx) => {
      let direction = tx.from_account_id === account.id ? 'sent' : 'received';
      let label = tx.type === 'transfer'
        ? (direction === 'sent' ? 'Chuyển khoản' : 'Nhận tiền')
        : (tx.type === 'debt_pay' ? (direction === 'sent' ? 'Thanh toán nhắc nợ' : 'Nhận thanh toán nhắc nợ') : 'Khác');

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

    // Fetch interbank transactions
    console.log('internal_account_id:', account.id);
    console.log('typeof internal_account_id:', typeof account.id);
    const interbankTxs = await InterbankTransaction.findAll({
      where: {
        internal_account_id: account.id
      },
      include: [
        { model: LinkedBank, as: 'bank_code_linked_bank' }
      ]
    });

    const formattedInterbank = interbankTxs.map((tx) => {
      const isOutgoing = tx.direction === 'outgoing';
      return {
        id: tx.id,
        type: 'interbank',
        label: isOutgoing ? 'Chuyển liên ngân hàng' : 'Nhận liên ngân hàng',
        direction: isOutgoing ? 'sent' : 'received',
        amount: tx.amount,
        fee: tx.fee,
        fee_payer: isOutgoing ? 'sender' : 'receiver',
        description: tx.description,
        timestamp: tx.createdat,
        from: isOutgoing
          ? { account_number: account.account_number, name: user.full_name }
          : { account_number: tx.external_account_number, name: tx.bank_code_linked_bank?.bank_name || tx.bank_code },
        to: isOutgoing
          ? { account_number: tx.external_account_number, name: tx.bank_code_linked_bank?.bank_name || tx.bank_code }
          : { account_number: account.account_number, name: user.full_name }
      };
    });

    console.log(req.user)

    const allTxs = [...formattedInternal, ...formattedInterbank];
    allTxs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ account_id: account.id, transactions: allTxs });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


export async function getAccountTransactionHistory(req, res) {
  try {
    const { account_number } = req.params;

    const account = await Account.findOne({
  where: { account_number },
  include: [{ model: User, as: 'user' }] // ✅ Add this
});
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Internal transactions
    const internalTxs = await Transaction.findAll({
      where: {
        [Op.or]: [
          { from_account_id: account.id },
          { to_account_id: account.id }
        ]
      },
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

    const formattedInternal = internalTxs.map((tx) => {
      const direction = tx.from_account_id === account.id ? 'sent' : 'received';
      const label = tx.type === 'transfer'
        ? (direction === 'sent' ? 'Chuyển khoản' : 'Nhận tiền')
        : (tx.type === 'debt_pay' ? (direction === 'sent' ? 'Thanh toán nhắc nợ' : 'Nhận thanh toán nhắc nợ') : 'Khác');

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

    // Interbank transactions
    const interbankTxs = await InterbankTransaction.findAll({
      where: {
        internal_account_id: account.id
      },
      include: [{ model: LinkedBank, as: 'bank_code_linked_bank' }]
    });

    const formattedInterbank = interbankTxs.map((tx) => {
      const isOutgoing = tx.direction === 'outgoing';

      return {
        id: tx.id,
        type: 'interbank',
        label: isOutgoing ? 'Chuyển liên ngân hàng' : 'Nhận liên ngân hàng',
        direction: isOutgoing ? 'sent' : 'received',
        amount: tx.amount,
        fee: 0,
        fee_payer: isOutgoing? "sender": "receiver",
        description: tx.description,
        timestamp: tx.createdat,
        from: isOutgoing
          ? { account_number: account.account_number, name: account.user?.full_name }
          : { account_number: tx.external_account_number, name: tx.bank_code_linked_bank?.bank_name || tx.bank_code },
        to: isOutgoing
          ? { account_number: tx.external_account_number, name: tx.bank_code_linked_bank?.bank_name || tx.bank_code }
          : { account_number: account.account_number, name: account.user?.full_name }
      };
    });

    const allTxs = [...formattedInternal, ...formattedInterbank].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      account_id: account.id,
      account_number: account.account_number,
      transactions: allTxs
    });

  } catch (error) {
    console.error('Error fetching account transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getInterbankReconciliation(req, res) {
  try {
    const start = req.query.start ? new Date(req.query.start) : moment().startOf('month').toDate();
    const end = req.query.end ? new Date(req.query.end) : moment().endOf('month').toDate();
    const bankCode = req.query.bank_code;

    const transactions = await InterbankTransaction.findAll({
      where: {
        status: 'success',
        createdat: {
          [Op.between]: [start, end],
        },
        ...(bankCode && { bank_code: bankCode }),
      },
      include: [{
        model: LinkedBank,
        as: 'bank_code_linked_bank',
        attributes: ['bank_code', 'bank_name'],
      }],
    });

    // Aggregate the data
    const result = {};
    for (const tx of transactions) {
      const bankCode = tx.bank_code;
      const direction = tx.direction;

      if (!result[bankCode]) {
        result[bankCode] = {
          bank_code: bankCode,
          bank_name: tx.bank_code_linked_bank?.bank_name || '',
          incoming: { total: 0, amount: 0, fee: 0 },
          outgoing: { total: 0, amount: 0, fee: 0 },
        };
      }

      result[bankCode][direction].total += 1;
      result[bankCode][direction].amount += Number(tx.amount);
      result[bankCode][direction].fee += Number(tx.fee);
    }

    res.json(Object.values(result));
  } catch (err) {
    console.error("Reconciliation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}