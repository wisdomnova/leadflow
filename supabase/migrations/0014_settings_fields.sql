-- Add Settings Fields to Users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT '(GMT-05:00) Eastern Time',
ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{
  "replies": {"email": true, "push": true},
  "reports": {"email": true, "push": false},
  "alerts": {"email": true, "push": true}
}'::jsonb;
