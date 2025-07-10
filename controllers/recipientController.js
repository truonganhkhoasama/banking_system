import Recipient from '../models/beneficiaries.js';
import Account from '../models/accounts.js';
import User from '../models/users.js';
import { verifyExternalAccount } from '../utils/bankServices/externalBankServices.js';

export async function getAllRecipients(req, res) {
  try {
    const userId = req.user.id;

    const recipients = await Recipient.findAll({
      where: { user_id: userId },
      attributes: ['id', 'account_number', 'bank_code', 'alias_name'],
    });

    res.json(recipients);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createRecipient(req, res) {
  try {
    const userId = req.user.id;
    const { account_number, bank_code: inputBankCode, alias_name } = req.body;

    const is_internal = !inputBankCode;
    const bank_code = is_internal ? null : inputBankCode;

    let finalAliasName = alias_name;

    if (is_internal) {
      const account = await Account.findOne({
        where: { account_number },
        include: [{ model: User, as: 'user', attributes: ['full_name'] }]
      });

      if (!account) {
        return res.status(404).json({ message: 'Internal account not found.' });
      }

      if (!finalAliasName) {
        finalAliasName = account.User?.full_name || 'Unnamed User';
      }
    } else {
      try {
        const verified = await verifyExternalAccount(bank_code, account_number);
        if (!finalAliasName) {
          finalAliasName = verified?.account_name || 'External User';
        }
      } catch (err) {
        return res.status(400).json({ message: `External account verification failed: ${err.message}` });
      }
    }

    const exists = await Recipient.findOne({
      where: {
        user_id: userId,
        account_number,
        bank_code,
      },
    });

    if (exists) {
      return res.status(409).json({ message: 'Recipient already exists.' });
    }

    const recipient = await Recipient.create({
      user_id: userId,
      account_number,
      bank_code,
      alias_name: finalAliasName,
      is_internal,
    });

    res.status(201).json(recipient);
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateRecipient(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { alias_name } = req.body;

    const recipient = await Recipient.findOne({
      where: { id, user_id: userId },
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    recipient.alias_name = alias_name;
    await recipient.save();

    res.json(recipient);
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteRecipient(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const recipient = await Recipient.findOne({
      where: { id, user_id: userId },
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    await recipient.destroy();

    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}