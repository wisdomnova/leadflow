-- Update roles to support more granular team permissions
-- Allows: admin, manager, sdr, executive

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Convert existing 'user' roles to 'sdr' as a default
UPDATE users SET role = 'sdr' WHERE role = 'user';

-- Ensure all current roles are valid before adding the constraint
UPDATE users SET role = 'sdr' WHERE role NOT IN ('admin', 'manager', 'sdr', 'executive');

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'manager', 'sdr', 'executive'));
