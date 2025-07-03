import express from 'express';
const router = express.Router();

// import { verifySignature } from '../middlewares/verifySignature.js';
import { queryAccountInfo, queryExternalAccountInfo } from '../../controllers/bankController';

router.post('/account-info', queryAccountInfo);
router.get('/query/:bank_code/:account_number', queryExternalAccountInfo);

// router.post('/deposit', verifySignature, depositFromExternalBank);

export default router;

