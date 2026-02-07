-- Add total_sends tracking to smart_servers
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS total_sends INTEGER DEFAULT 0;

-- Update the rotation function to also increment total_sends when a node is picked?
-- Actually, incrementing is usually done by the processor. 
-- But adding the column is necessary for the API to not return undefined.
