import Recipient from '../models/beneficiaries.js';

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
    const { account_number, bank_code, alias_name } = req.body;

    // Prevent duplicates
    const exists = await Recipient.findOne({
      where: { user_id: userId, account_number, bank_code },
    });
    if (exists) {
      return res.status(409).json({ message: 'Recipient already exists.' });
    }

    const recipient = await Recipient.create({
      user_id: userId,
      account_number,
      bank_code,
      alias_name,
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