-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_user_total_points()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update points if lesson was just completed
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    -- Insert or update user_points table
    INSERT INTO public.user_points (user_id, total_points)
    VALUES (
      NEW.user_id, 
      NEW.points_earned
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_points = user_points.total_points + NEW.points_earned,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;