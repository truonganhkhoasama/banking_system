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