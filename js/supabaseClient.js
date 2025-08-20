import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://bkoupsifunrusaixmxvn.supabase.co';
export const SUPABASE_FUNCTION_URL = 'https://bkoupsifunrusaixmxvn.supabase.co/functions/v1/maps-geocode';

export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrb3Vwc2lmdW5ydXNhaXhteHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzA2OTgsImV4cCI6MjA2OTI0NjY5OH0.lnsuc_zdJkJbztzXf3__Z-7CipGYE6OtkbAmJoLCC14';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);