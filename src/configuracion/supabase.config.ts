export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
};

export const APP_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://academiavallenataonline.com',
  environment: process.env.NODE_ENV || 'development'
};
