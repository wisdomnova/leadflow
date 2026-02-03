-- Add Profile Fields to Users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS monthly_target_goal INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS response_rate_goal NUMERIC DEFAULT 10;

-- Update RLS for users to allow updates
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (
    id::text = (auth.jwt() ->> 'userId')
)
WITH CHECK (
    id::text = (auth.jwt() ->> 'userId')
);
