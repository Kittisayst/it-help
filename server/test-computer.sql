INSERT IGNORE INTO computer (id, hostname, ipAddress, department, `group`, apiKey, lastSeenAt, createdAt) 
VALUES ('test-comp-123', 'test-pc', '192.168.1.100', 'IT', 'Test', 'test-key-123', NOW(), NOW());
