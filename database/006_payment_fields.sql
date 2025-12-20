-- Add payment-related columns to users table
ALTER TABLE users ADD COLUMN payment_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscription_current_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN billing_cycle VARCHAR(20) DEFAULT 'monthly';

-- Add indexes for faster queries
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX idx_users_payment_status ON users(payment_status);
