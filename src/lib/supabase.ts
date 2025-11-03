import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Para desenvolvimento, usamos valores padrão se as variáveis de ambiente não estiverem definidas
const url = supabaseUrl || 'https://rlnxipzrvzqzbphjcuuw.supabase.co';
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiIjoic3VwYWJhc2UiLCJyZWZfZGVmYXVsdF9yb2xlIjoiYW5vbiIsImlhdCI6MTczMDI0NzQ1MywiZXhwIjoyMDQ1ODIzNDUzfQ.R0h9SOW5d2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z';

export const supabase = createClient(url, key);