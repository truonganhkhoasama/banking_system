-- ===================================
-- USERS & AUTHENTICATION
-- ===================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('customer', 'employee', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('login', 'transfer', 'forgot_pass', 'debt_payment')),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================================
-- BANK ACCOUNTS & TRANSACTIONS
-- ===================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID,
    to_account_id UUID,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deposit', 'withdraw', 'transfer', 'debt_pay')),
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed')),
    fee_payer VARCHAR(10) CHECK (fee_payer IN ('sender', 'receiver')) DEFAULT 'sender',
    fee DECIMAL(15, 2) DEFAULT 0.00,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_from FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_transaction_to FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- ===================================
-- BENEFICIARIES & INTERBANK
-- ===================================

CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    bank_code VARCHAR(20) NULL, -- NULL if internal
    alias_name VARCHAR(100),
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_beneficiary_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bank_code FOREIGN KEY (bank_code) REFERENCES linked_banks(bank_code) ON DELETE SET NULL,

    CONSTRAINT unique_beneficiary UNIQUE (user_id, account_number, bank_code)
);

CREATE TABLE linked_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_code VARCHAR(20) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    public_key TEXT NOT NULL,
    shared_secret TEXT NOT NULL,
    callback_url TEXT,
    deposit_url TEXT,
    verify_account_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interbank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direction VARCHAR(20) CHECK (direction IN ('incoming', 'outgoing')) NOT NULL,
    internal_account_id UUID, -- FK to internal accounts
    external_account_number VARCHAR(20),
    bank_code VARCHAR(20),

    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'pending')) NOT NULL,
    description TEXT,
    fee DECIMAL(15, 2) DEFAULT 0.00,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank FOREIGN KEY (bank_code) REFERENCES linked_banks(bank_code) ON DELETE SET NULL,
    CONSTRAINT fk_internal_account FOREIGN KEY (internal_account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ===================================
-- DEBT REMINDERS
-- ===================================

DROP TABLE IF EXISTS debt_reminders;

CREATE TABLE debt_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL,
    to_user_id UUID NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_debt_from FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_debt_to FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================================
-- API LOGS
-- ===================================

CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INT,
    request_body TEXT,
    response_body TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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