// utils/verifyRecaptcha.js
import axios from 'axios';

export async function verifyRecaptcha(token) {
  const url = `https://www.google.com/recaptcha/api/siteverify`;
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  const res = await axios.post(url, null, {
    params: {
      secret,
      response: token,
    },
  });

  return res.data;
}
