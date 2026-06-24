import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://vescjjkwgkmjhbsgbvvt.supabase.co';
const supabaseAnonKey = 'sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
