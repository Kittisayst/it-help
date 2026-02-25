CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(30) PRIMARY KEY,
  userId VARCHAR(30) NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  ipAddress VARCHAR(45) NULL,
  userAgent TEXT NULL,
  computerId VARCHAR(30) NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_created_at (createdAt),
  INDEX idx_user_id (userId),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
