-- Fix missing foreign key relationship in activity_log
-- This allows PostgREST joins between activity_log and users

ALTER TABLE activity_log
ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL;
