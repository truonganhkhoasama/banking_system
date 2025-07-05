import Account from '../models/accounts.js';

export default async function getUserAccounts(req, res) {
  try {
    const userId = req.user.id; // assuming authentication middleware sets req.user

    const account = await Account.findOne({
      where: { user_id: userId },
      attributes: ['account_number', 'balance'], // only show required fields
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json([account]); // still return as a list, per spec wording
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function depositToAccount(req, res) {
  try {
    const { amount, account_number } = req.body;

    const account = await Account.findOne({ where: { account_number } });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const balance = parseFloat(account.balance) + amount;
    account.balance = balance;
    await account.save();

    res.status(200).json({
      message: 'Deposit successful',
      account_number: account.account_number,
      deposited_amount: amount,
      new_balance: account.balance
    });
  } catch (error) {
    console.error('Error depositing to account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}