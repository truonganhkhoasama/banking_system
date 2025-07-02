\set ON_ERROR_STOP on


CREATE OR REPLACE FUNCTION update_updatedAt_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedat" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updatedAt
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- OTP_CODES
CREATE OR REPLACE TRIGGER trg_otp_codes_updatedAt
BEFORE UPDATE ON otp_codes
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- ACCOUNTS
CREATE OR REPLACE TRIGGER trg_accounts_updatedAt
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- TRANSACTIONS
CREATE OR REPLACE TRIGGER trg_transactions_updatedAt
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- BENEFICIARIES
CREATE OR REPLACE TRIGGER trg_beneficiaries_updatedAt
BEFORE UPDATE ON beneficiaries
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- LINKED_BANKS
CREATE OR REPLACE TRIGGER trg_linked_banks_updatedAt
BEFORE UPDATE ON linked_banks
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- INTERBANK_TRANSACTIONS
CREATE OR REPLACE TRIGGER trg_interbank_transactions_updatedAt
BEFORE UPDATE ON interbank_transactions
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- DEBT_REMINDERS
CREATE OR REPLACE TRIGGER trg_debt_reminders_updatedAt
BEFORE UPDATE ON debt_reminders
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();

-- API_LOGS
CREATE OR REPLACE TRIGGER trg_api_logs_updatedAt
BEFORE UPDATE ON api_logs
FOR EACH ROW EXECUTE FUNCTION update_updatedAt_column();