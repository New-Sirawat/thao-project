import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vescjjkwgkmjhbsgbvvt.supabase.co';
const supabaseAnonKey = 'sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
