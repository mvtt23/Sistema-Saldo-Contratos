import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Usando as credenciais do projeto como fallback ou principal
const url = supabaseUrl || 'https://yfathgpgbxalleuzyfln.supabase.co';
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmYXRoZ3BnYnhhbGxldXp5ZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjI2MzQsImV4cCI6MjA3NzMzODYzNH0.AolDcE7yKXS6KTjD-G1wYmLtK0OtTNP5uErKte-NqPk';

export const supabase = createClient(url, key);