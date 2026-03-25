
ALTER TABLE t_p45110186_greeting_project_202.users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE t_p45110186_greeting_project_202.users
  ALTER COLUMN password_hash TYPE VARCHAR(72);

CREATE TABLE IF NOT EXISTS t_p45110186_greeting_project_202.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p45110186_greeting_project_202.users(id),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p45110186_greeting_project_202.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p45110186_greeting_project_202.users(id),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON t_p45110186_greeting_project_202.users(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON t_p45110186_greeting_project_202.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON t_p45110186_greeting_project_202.email_verification_tokens(token_hash);
