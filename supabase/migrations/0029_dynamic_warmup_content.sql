-- 0029_dynamic_warmup_content.sql
-- Supports dynamic, high-variance warmup correspondence to improve deliverability

-- 1. Warmup Content Library
CREATE TABLE IF NOT EXISTS public.warmup_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('subject', 'body')),
    content TEXT NOT NULL,
    tone TEXT DEFAULT 'professional',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed with initial high-variance content
INSERT INTO public.warmup_content (category, content, tone) VALUES
('subject', 'Quick sync on the Q1 numbers?', 'professional'),
('subject', 'Question about the upcoming event', 'professional'),
('subject', 'RE: Discussion from yesterday', 'professional'),
('subject', 'Thoughts on the latest draft?', 'professional'),
('subject', 'Missing details for the report', 'professional'),
('subject', 'Hey! Checking in', 'casual'),
('subject', 'Are we still on for lunch?', 'casual'),
('subject', 'The feedback you requested', 'professional'),
('subject', 'Proposal update', 'professional'),
('subject', 'New project scope', 'professional'),
('body', 'I was reviewing the document you sent over and had a few minor questions about the timeline. Let me know when you have a moment to chat.', 'professional'),
('body', 'Great job on the presentation today. I think the board will be really impressed with the direction we are taking.', 'professional'),
('body', 'Could you send over the updated spreadsheet? I want to make sure I have the latest version before our meeting.', 'professional'),
('body', 'Just wanted to touch base and see how things are going on your end. Are we still tracking for the launch?', 'professional'),
('body', 'I found a couple of small typos in the latest version of the proposal. I can fix them, or I can send the notes back to you.', 'professional'),
('body', 'That sounds like a great plan. I am looking forward to seeing the results of the pilot program.', 'professional'),
('body', 'Let me know if you need any help with the research for the next phase. I have some extra capacity this week.', 'professional'),
('body', 'I really enjoyed our conversation yesterday. It gave me a lot to think about regarding the long-term strategy.', 'professional');

-- 3. RPC to get random warmup content
CREATE OR REPLACE FUNCTION get_random_warmup_content(req_category TEXT, num_results INTEGER)
RETURNS TABLE (content TEXT) AS $$
BEGIN
    RETURN QUERY 
    SELECT wc.content 
    FROM warmup_content wc
    WHERE wc.category = req_category
    ORDER BY random()
    LIMIT num_results;
END;
$$ LANGUAGE plpgsql;
