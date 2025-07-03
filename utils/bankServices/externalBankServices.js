import axios from 'axios';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import LinkedBank from '../../models/linked_banks.js'; // adjust path as needed
import { verifySignature } from '../bankSecurity.js'; // your existing signature verifier

export async function verifyExternalAccount(bank_code, account_number) {
    const bank = await LinkedBank.findOne({ where: { bank_code } });
    if (!bank) throw new Error('Unknown bank');

    const sharedSecret = bank.shared_secret;
    const privateKeyPath = path.join(process.cwd(), 'bank_system_private.pem');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    const timestamp = Math.floor(Date.now());
    const payload = `${account_number}.${timestamp}`;
    const hash = crypto.createHmac('sha256', sharedSecret).update(payload).digest('hex');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(payload);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');

    const response = await axios.post(`${bank.callback_url}/account-info`, {
        account_number,
        timestamp,
        bank_code: process.env.BANK_CODE,
        hash,
        signature,
    });

    const { data: responseData, signature: responseSignature } = response.data;

    const isValid = verifySignature(JSON.stringify(responseData), responseSignature, bank.public_key);
    if (!isValid) throw new Error('Invalid response signature');

    return responseData;
}
