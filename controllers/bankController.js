import LinkedBank from '../models/linked_banks.js';
import Account from '../models/accounts.js';
import { isFresh, signPayload, verifyHMAC, verifySignature } from '../utils/bankSecurity.js';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
import path from 'path';

export async function queryAccountInfo(req, res) {
    try {
        const { account_number, timestamp, bank_code, hash, signature } = req.body;

        if (!isFresh(timestamp)) {
            return res.status(400).json({ error: 'Request expired' });
        }

        const bank = await LinkedBank.findOne({ where: { bank_code } });
        if (!bank) return res.status(403).json({ error: 'Unknown bank' });

        const sharedSecret = bank.shared_secret;
        if (!sharedSecret) {
            return res.status(500).json({ error: 'Shared secret not configured' });
        }

        const payload = `${account_number}.${timestamp}`;
        if (!verifyHMAC(payload, sharedSecret, hash)) {
            return res.status(403).json({ error: 'Invalid hash' });
        }

        if (!verifySignature(payload, signature, bank.public_key)) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const account = await Account.findOne({ where: { account_number } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const responseData = {
            account_number: account.account_number,
            full_name: account.full_name,
            balance: account.balance,
        };

        const privateKeyPath = path.join(process.cwd(), 'bank_system_private.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

        const responseSignature = signPayload(privateKey, responseData);

        console.log('Received body:', req.body);
        console.log('Bank:', bank);
        console.log('Shared secret:', sharedSecret);
        console.log('Payload:', payload);
        console.log('Hash verified:', verifyHMAC(sharedSecret, payload, hash));

        return res.json({
            data: responseData,
            signature: responseSignature,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal error' });
    }
};

// export async function transferToOtherBank(req, res) {
//     try {
//         const { bank_code, target_account_number, amount } = req.body;

//         // ✅ Confirm target account exists in external bank
//         const result = await queryExternalAccountInfo(bank_code, target_account_number);
//         const { full_name } = result.data;

//         // ✅ Do your local balance deduction logic here

//         // ✅ Optionally trigger deposit on the other bank (not shown yet)

//         return res.json({
//             message: `Transferred ${amount} to ${full_name} at ${bank_code}`,
//         });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Transfer failed' });
//     }
// };



export async function queryExternalAccountInfo(req, res) {
    try {
        const { bank_code, account_number } = req.params;

        const bank = await LinkedBank.findOne({ where: { bank_code } });
        if (!bank) return res.status(400).json({ error: 'Unknown bank' });

        const sharedSecret = bank.shared_secret;
        const privateKeyPath = path.join(process.cwd(), 'bank_system_private.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

        const timestamp = Math.floor(Date.now() / 1000);
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

        res.json(response.data);
    } catch (err) {
        console.error('Query error:', err.message);
        res.status(500).json({ error: err.message });
    }
}