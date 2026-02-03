-- Default Seed List for testing
INSERT INTO seed_list (email, provider) VALUES
('test-gmail@example.com', 'gmail'),
('test-outlook@example.com', 'outlook'),
('test-zoho@example.com', 'zoho'),
('test-apple@example.com', 'apple'),
('test-gmail-2@example.com', 'gmail')
ON CONFLICT (email) DO NOTHING;
