// services/bankSecurity.js
import { createHmac, createVerify, createSign } from 'crypto';

export function isFresh(timestamp) {
    const now = Date.now();
    return Math.abs(now - Number(timestamp)) < 5 * 60 * 1000; // 5 minutes
}

export function verifyHMAC(payload, secret, givenHmac) {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const calculated = hmac.digest('hex');
    return calculated === givenHmac;
}

export function verifySignature(payload, signatureBase64, publicKey) {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(payload);
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(signatureBase64, 'base64'));
}

export function signPayload(privateKey, payloadObject) {
    const signer = createSign('RSA-SHA256');
    const payloadString = JSON.stringify(payloadObject);
    signer.update(payloadString);
    signer.end();
    return signer.sign(privateKey, 'base64');
}