import axios from 'axios';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import LinkedBank from '../../models/linked_banks.js';

export async function verifyExternalAccount(bank_code, account_number) {
    const bank = await LinkedBank.findOne({ where: { bank_code } });
    if (!bank) throw new Error('Unknown bank');

    const sharedSecret = bank.shared_secret;
    const timestamp = Math.floor(Date.now());
    const payload = `${account_number}.${timestamp}`;
    const hash = crypto.createHmac('sha256', sharedSecret).update(payload).digest('hex');

    const response = await axios.post(`${bank.callback_url}${bank.verify_account_url}`, {
        account_number,
        timestamp,
        bank_code: process.env.BANK_CODE,
        hash,
    });

    const { data: responseData } = response.data;

    return {
        success: true,
        ...responseData
    };
}
