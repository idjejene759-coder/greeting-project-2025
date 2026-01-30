-- Таблица для заявок на вывод из реферальной программы
CREATE TABLE IF NOT EXISTS t_p45110186_greeting_project_202.referral_withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p45110186_greeting_project_202.users(id),
    username VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    crypto_type VARCHAR(20) NOT NULL,
    network VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    admin_note TEXT
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_referral_withdrawal_user_id ON t_p45110186_greeting_project_202.referral_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawal_status ON t_p45110186_greeting_project_202.referral_withdrawal_requests(status);