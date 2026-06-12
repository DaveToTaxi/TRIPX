import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://nfeddtbugdexgzardtty.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_ZnUU0MUW0e3-6Fn8EBKPBQ_9Di7z9N-'
);
