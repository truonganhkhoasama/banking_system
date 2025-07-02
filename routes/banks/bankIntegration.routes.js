router.post('/account-info', verifySignature, getExternalAccountInfo);
router.post('/deposit', verifySignature, depositFromExternalBank);
