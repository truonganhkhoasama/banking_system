router.get('/employees', authenticateAdmin, listEmployees);
router.get('/bank-transactions', authenticateAdmin, viewBankTransactions); // filters: by date range, by bank
