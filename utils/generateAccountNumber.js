
import Account from '../models/accounts.js';

export default async function generateUniqueAccountNumber() {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await Account.findOne({ where: { account_number: accountNumber } });
    if (!existing) exists = false;
  }

  return accountNumber;
}