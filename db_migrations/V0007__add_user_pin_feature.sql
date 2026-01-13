-- Добавление поля is_pinned для закрепления пользователей
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Создание индекса для быстрого поиска закреплённых пользователей
CREATE INDEX IF NOT EXISTS idx_users_is_pinned ON users(is_pinned);