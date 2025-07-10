import LinkedBank from '../models/linked_banks.js';
import Account from '../models/accounts.js';
import User from '../models/users.js';
import OtpCode from '../models/otp_codes.js';
import InterbankTransaction from '../models/interbank_transactions.js';
import { isFresh, verifyHMAC, verifySignature, signPayload } from '../utils/bankSecurity.js';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
import path from 'path';
import { generateOtpCode } from '../utils/otp.js';
import { sendOtpToEmail } from '../utils/email.js';
import { sequelize } from '../db.js'
import { Op } from 'sequelize';
import { verifyExternalAccount } from '../utils/bankServices/externalBankServices.js';

const TRANSFER_FEE = 5000.00;
const OTP_EXPIRY_MINUTES = 5;


export async function queryAccountInfo(req, res) {
    try {
        const { account_number, timestamp, bank_code, hash } = req.body;

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

        const account = await Account.findOne({
            where: { account_number },
            include: {
                model: User,
                as: 'user',
                attributes: ['full_name'],
            },
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const responseData = {
            account_number: account.account_number,
            full_name: account.user.full_name,
            balance: account.balance,
        };

        return res.json({ data: responseData });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal error' });
    }
}


export async function queryExternalAccountInfo(req, res) {
    try {
        const { bank_code, account_number } = req.params;

        const responseData = await verifyExternalAccount(bank_code, account_number);

        res.json({ verified: true, data: responseData });
    } catch (err) {
        console.error('Query error:', err.message);
        res.status(500).json({ error: err.message });
    }
}

export async function depositToAccount(req, res) {
    try {
        const { account_number, amount, timestamp, bank_code, hash, signature, message, from_account_number } = req.body;

        // Freshness check
        if (!isFresh(timestamp)) {
            return res.status(400).json({ error: 'Request expired' });
        }

        // Linked bank verification
        const bank = await LinkedBank.findOne({ where: { bank_code } });
        if (!bank) return res.status(403).json({ error: 'Unknown bank' });

        // Shared secret + hash validation
        const payload = `${account_number}.${from_account_number}.${amount}.${timestamp}`;
        if (!verifyHMAC(payload, bank.shared_secret, hash)) {
            return res.status(403).json({ error: 'Invalid hash' });
        }

        // Digital signature check (RSA)
        if (!verifySignature(payload, signature, bank.public_key)) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const account = await Account.findOne({ where: { account_number } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const total = parseFloat(account.balance) + amount;
        account.balance = total;
        await account.save();

        await InterbankTransaction.create({
            direction: 'incoming',
            internal_account_id: account.id,
            external_account_number: from_account_number,
            bank_code,
            amount,
            status: 'success',
            description: message || `Deposit from ${bank_code}`,
        });


        const responsePayload = {
            status: 'success',
            new_balance: account.balance,
            account_number,
            timestamp: Date.now()
        };

        const privateKeyPath = path.join(process.cwd(), 'bank_system_private.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const responseSignature = signPayload(privateKey, responsePayload);

        res.json({
            data: responsePayload,
            signature: responseSignature
        });
    } catch (err) {
        console.error('Deposit error:', err.message);
        res.status(500).json({ error: 'Internal error' });
    }
}

export async function initiateExternalTransfer(req, res) {
    try {
        const { bank_code, to_account_number, amount, message } = req.body;
        const userId = req.user.id;

        const fromAccount = await Account.findOne({ where: { user_id: userId } });
        if (!fromAccount) {
            return res.status(400).json({ message: 'Invalid sender account' });
        }

        const linkedBank = await LinkedBank.findOne({ where: { bank_code: bank_code } });
        if (!linkedBank || !linkedBank.is_active) {
            return res.status(400).json({ message: 'Invalid or inactive target bank' });
        }

        const verification = await verifyExternalAccount(
            bank_code,
            to_account_number
        );
        if (!verification.success) {
            return res.status(400).json({ message: verification.reason || 'Destination account not found at the specified bank' });
        }

        const totalAmount = amount + TRANSFER_FEE;
        if (fromAccount.balance < totalAmount) {
            return res.status(400).json({ message: 'Insufficient balance to cover amount and fee' });
        }

        const otp = generateOtpCode();;
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000); // 5 minutes

        await OtpCode.create({
            user_id: userId,
            code: otp,
            type: 'transfer',
            expires_at: expiresAt
        });

        const user = await User.findByPk(userId);
        await sendOtpToEmail(user.email, otp);

        return res.json({ message: 'OTP sent to email for external transfer' });
    } catch (error) {
        console.error('Error initiating external transfer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export async function externalDepositToLinkedBank(req, res) {
    const t = await sequelize.transaction();
    let createdTx = null;

    try {
        const userId = req.user.id;
        const { bank_code, to_account_number, amount, otp_code, message } = req.body;

        // Validate OTP
        const otp = await OtpCode.findOne({
            where: {
                user_id: userId,
                code: otp_code.toString(),
                type: 'transfer',
                is_used: false,
                expires_at: { [Op.gt]: new Date() },
            },
        });

        if (!otp) {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const fromAccount = await Account.findOne({ where: { user_id: userId } });
        if (!fromAccount) {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid sender account' });
        }

        const linkedBank = await LinkedBank.findOne({ where: { bank_code } });
        if (!linkedBank || !linkedBank.is_active) {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid or inactive target bank' });
        }

        const verification = await verifyExternalAccount(
            bank_code,
            to_account_number
        );
        if (!verification.success) {
            await t.rollback();
            return res.status(400).json({ message: verification.reason || 'Destination account not found at the specified bank' });
        }

        const totalDeduct = amount + TRANSFER_FEE;
        if (fromAccount.balance < totalDeduct) {
            await t.rollback();
            return res.status(400).json({ message: 'Insufficient balance for transfer and fee' });
        }

        await fromAccount.update(
            { balance: fromAccount.balance - totalDeduct },
            { transaction: t }
        );

        createdTx = await InterbankTransaction.create({
            direction: 'outgoing',
            internal_account_id: fromAccount.id,
            external_account_number: to_account_number,
            bank_code,
            fee: TRANSFER_FEE,
            amount,
            status: 'pending',
            description: message || null,
        }, { transaction: t });

        await otp.update({ is_used: true }, { transaction: t });

        const timestamp = Date.now();
        const depositPayload = `${to_account_number}.${fromAccount.account_number}.${amount}.${timestamp}`;
        const hash = crypto.createHmac('sha256', linkedBank.shared_secret).update(depositPayload).digest('hex');

        const privateKeyPath = path.join(process.cwd(), 'bank_system_private.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const signature = crypto.createSign('RSA-SHA256').update(depositPayload).end().sign(privateKey, 'base64');

        const depositRequestBody = {
            account_number: to_account_number,
            from_account_number: fromAccount.account_number,
            amount,
            timestamp,
            bank_code: process.env.BANK_CODE,
            hash,
            signature,
            message: message || `Deposit from ${fromAccount.account_number}`,
        };

        const response = await axios.post(`${linkedBank.callback_url}${linkedBank.deposit_url}`, depositRequestBody);
        const { data: responseData, signature: responseSignature } = response.data;

        const isValidResponse = verifySignature(
            JSON.stringify(responseData),
            responseSignature,
            linkedBank.public_key
        );

        if (!isValidResponse) throw new Error('Invalid signature from target bank');
        if (responseData.status !== 'success') throw new Error('External deposit failed');

        await InterbankTransaction.update(
            { status: 'success' },
            {
                where: { id: createdTx.id },
                transaction: t,
            }
        );

        await t.commit();
        res.json({ message: 'External transfer initiated successfully' });

    } catch (error) {
        await t.rollback();

        if (createdTx) {
            try {
                await InterbankTransaction.update(
                    { status: 'failed' },
                    { where: { id: createdTx.id } }
                );
            } catch (err) {
                console.error('Failed to mark transaction as failed:', err.message);
            }
        }

        console.error('Error in external transfer:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}