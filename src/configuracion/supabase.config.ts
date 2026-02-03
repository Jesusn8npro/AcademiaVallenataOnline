export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};

export const APP_CONFIG = {
  baseUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  environment: import.meta.env.NODE_ENV || 'development'
};
