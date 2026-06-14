import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rrvnxgdauvraheehqzhz.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydm54Z2RhdXZyYWhlZWhxemh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODkxMzgsImV4cCI6MjA5NTI2NTEzOH0.Nprm_A1PgQJUDl7YzuU74_-BtCQP1ksxEFONr1_b5Go';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);