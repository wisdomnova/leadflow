-- RPC for atomic warmup stats increment
CREATE OR REPLACE FUNCTION increment_warmup_stat(
    account_id_param UUID,
    date_param DATE,
    column_param TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE warmup_stats SET %I = %I + 1 WHERE account_id = $1 AND date = $2', column_param, column_param)
    USING account_id_param, date_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
