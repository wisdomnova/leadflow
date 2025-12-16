-- Add Stripe product and price IDs to plans table
ALTER TABLE plans 
ADD COLUMN stripe_product_id VARCHAR(255),
ADD COLUMN stripe_price_id VARCHAR(255);

-- Update plans with demo Stripe product IDs
-- These are fake demo IDs for development
UPDATE plans SET
  stripe_product_id = 'prod_trial_demo_001',
  stripe_price_id = NULL
WHERE name = 'Trial';

UPDATE plans SET
  stripe_product_id = 'prod_starter_demo_002',
  stripe_price_id = 'price_starter_demo_002'
WHERE name = 'Starter';

UPDATE plans SET
  stripe_product_id = 'prod_growth_demo_003',
  stripe_price_id = 'price_growth_demo_003'
WHERE name = 'Growth';

UPDATE plans SET
  stripe_product_id = 'prod_pro_demo_004',
  stripe_price_id = 'price_pro_demo_004'
WHERE name = 'Pro';

-- Add indexes for faster lookup
CREATE INDEX idx_plans_stripe_product_id ON plans(stripe_product_id);
CREATE INDEX idx_plans_stripe_price_id ON plans(stripe_price_id);
