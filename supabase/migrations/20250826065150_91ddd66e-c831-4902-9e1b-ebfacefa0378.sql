-- Fix function search path security issue
ALTER FUNCTION public.handle_new_telegram_user() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';