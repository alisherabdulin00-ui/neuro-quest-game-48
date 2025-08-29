-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, max_coins)
  VALUES (NEW.id, 'free', 50);
  RETURN NEW;
END;
$$;