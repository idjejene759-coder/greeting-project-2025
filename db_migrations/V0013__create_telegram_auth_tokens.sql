CREATE TABLE t_p45110186_greeting_project_202.telegram_auth_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(50),
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);