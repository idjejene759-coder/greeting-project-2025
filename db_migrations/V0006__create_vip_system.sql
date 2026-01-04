-- Создание таблицы VIP заявок
CREATE TABLE IF NOT EXISTS vip_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    payment_screenshot_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by_admin_id INTEGER REFERENCES admins(id)
);

-- Добавление поля is_vip в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP;

-- Создание индекса для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_vip_requests_status ON vip_requests(status);
CREATE INDEX IF NOT EXISTS idx_vip_requests_user_id ON vip_requests(user_id);