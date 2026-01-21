-- Добавляем поля для отслеживания реферальной статистики
ALTER TABLE t_p45110186_greeting_project_202.users 
ADD COLUMN IF NOT EXISTS referral_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_registrations INTEGER DEFAULT 0;