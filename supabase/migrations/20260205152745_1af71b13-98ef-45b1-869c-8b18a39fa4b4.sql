-- Fix user_roles table: Add admin-only policies for complete role management

-- Create policy for admins to manage roles (INSERT)
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin());

-- Create policy for admins to update roles
CREATE POLICY "Only admins can update user roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin());

-- Create policy for admins to delete roles  
CREATE POLICY "Only admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.is_admin());

-- Create a rate limiting table for contact form submissions
CREATE TABLE public.contact_rate_limits (
    ip_hash TEXT PRIMARY KEY,
    submission_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read/write rate limits (needed for rate check function)
CREATE POLICY "Anyone can manage rate limits"
ON public.contact_rate_limits FOR ALL
USING (true)
WITH CHECK (true);

-- Create rate limit check and increment function
CREATE OR REPLACE FUNCTION public.check_and_increment_contact_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_ip TEXT;
    hashed_ip TEXT;
    current_count INTEGER;
    max_submissions INTEGER := 5;
    rate_window INTERVAL := '1 hour';
BEGIN
    -- Try to get client IP from request headers
    BEGIN
        client_ip := COALESCE(
            current_setting('request.headers', true)::json->>'x-real-ip',
            current_setting('request.headers', true)::json->>'x-forwarded-for',
            'unknown'
        );
    EXCEPTION WHEN OTHERS THEN
        client_ip := 'unknown';
    END;
    
    -- Hash the IP for privacy
    hashed_ip := encode(sha256(client_ip::bytea), 'hex');
    
    -- Clean up old entries and check/update rate limit atomically
    DELETE FROM public.contact_rate_limits 
    WHERE window_start < now() - rate_window;
    
    -- Try to get current count
    SELECT submission_count INTO current_count
    FROM public.contact_rate_limits
    WHERE ip_hash = hashed_ip;
    
    IF current_count IS NULL THEN
        -- First submission in window
        INSERT INTO public.contact_rate_limits (ip_hash, submission_count, window_start)
        VALUES (hashed_ip, 1, now());
        RETURN TRUE;
    ELSIF current_count < max_submissions THEN
        -- Under limit, increment
        UPDATE public.contact_rate_limits
        SET submission_count = submission_count + 1
        WHERE ip_hash = hashed_ip;
        RETURN TRUE;
    ELSE
        -- Rate limit exceeded
        RETURN FALSE;
    END IF;
END;
$$;

-- Replace permissive contact form policy with rate-limited version
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Rate limited contact form submissions"
ON public.contact_messages FOR INSERT
WITH CHECK (public.check_and_increment_contact_rate_limit());