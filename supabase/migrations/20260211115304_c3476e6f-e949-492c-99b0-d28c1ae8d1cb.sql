
-- Create admin user directly via insert into auth.users won't work, let's use a function
-- We need to use the supabase admin API. Let's create a setup function instead.
-- Actually, let's just insert directly since we have service role access through migrations

-- First check if http extension exists and enable it
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
