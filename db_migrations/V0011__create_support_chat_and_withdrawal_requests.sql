-- Таблица для сообщений поддержки
CREATE TABLE IF NOT EXISTS t_p45110186_greeting_project_202.support_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p45110186_greeting_project_202.users(id),
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    admin_username VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Таблица для заявок на вывод средств
CREATE TABLE IF NOT EXISTS t_p45110186_greeting_project_202.withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p45110186_greeting_project_202.users(id),
    username VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    network VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    admin_note TEXT
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON t_p45110186_greeting_project_202.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON t_p45110186_greeting_project_202.support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON t_p45110186_greeting_project_202.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON t_p45110186_greeting_project_202.withdrawal_requests(status);