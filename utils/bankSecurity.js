// services/bankSecurity.js
import { createHmac, createVerify } from 'crypto';

export default function isFresh(timestamp) {
    const now = Date.now();
    return Math.abs(now - Number(timestamp)) < 5 * 60 * 1000; // 5 minutes
}

export default function verifyHMAC(payload, secret, givenHmac) {
    const hmac = createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const calculated = hmac.digest('hex');
    return calculated === givenHmac;
}

export default function verifySignature(payload, signatureBase64, publicKey) {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(JSON.stringify(payload));
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(signatureBase64, 'base64'));
}

export default function signPayload(privateKey, payloadObject) {
    const signer = crypto.createSign('RSA-SHA256');
    const payloadString = JSON.stringify(payloadObject);
    signer.update(payloadString);
    signer.end();
    return signer.sign(privateKey, 'base64');
}