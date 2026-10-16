import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsymcpwugxcmrqxaktbg.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeW1jcHd1Z3hjbXJxeGFrdGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDUwMzEsImV4cCI6MjEwNTkyMTAzMX0.Jn1oalT0s8KxxDcJ3uVfL9fktM1OMAiGz-4LrswaEJ4';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
