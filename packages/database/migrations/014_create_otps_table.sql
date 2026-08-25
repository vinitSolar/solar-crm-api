-- Create otps table as a fallback for Redis
CREATE TABLE IF NOT EXISTS otps (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_otps PRIMARY KEY (id),
  CONSTRAINT uq_otps_uid UNIQUE (uid),
  CONSTRAINT uq_otps_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
