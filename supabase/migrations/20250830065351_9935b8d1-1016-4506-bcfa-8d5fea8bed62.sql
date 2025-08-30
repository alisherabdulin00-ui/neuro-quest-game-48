-- Update the user experience function to use exponential level calculation
CREATE OR REPLACE FUNCTION public.update_user_experience()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  xp_reward INTEGER;
  new_level INTEGER;
  base_xp INTEGER;
  growth_factor NUMERIC;
  total_xp INTEGER;
  remaining_xp INTEGER;
  level_xp INTEGER;
BEGIN
  -- Only update XP if lesson was just completed
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    -- Get XP reward from system settings
    SELECT (setting_value::TEXT)::INTEGER INTO xp_reward
    FROM public.system_settings 
    WHERE setting_key = 'xp_per_lesson';
    
    IF xp_reward IS NULL THEN
      xp_reward := 10; -- fallback default
    END IF;
    
    -- Get level calculation parameters
    SELECT (setting_value::TEXT)::INTEGER INTO base_xp
    FROM public.system_settings 
    WHERE setting_key = 'level_base_xp';
    
    SELECT (setting_value::TEXT)::NUMERIC INTO growth_factor
    FROM public.system_settings 
    WHERE setting_key = 'level_growth_factor';
    
    IF base_xp IS NULL THEN
      base_xp := 100; -- fallback default
    END IF;
    
    IF growth_factor IS NULL THEN
      growth_factor := 1.5; -- fallback default
    END IF;
    
    -- Calculate total XP after reward
    total_xp := COALESCE((SELECT total_xp FROM public.user_experience WHERE user_id = NEW.user_id), 0) + xp_reward;
    
    -- Calculate new level using exponential formula
    new_level := 1;
    remaining_xp := total_xp;
    
    WHILE remaining_xp >= 0 LOOP
      level_xp := ROUND(base_xp * POWER(growth_factor, new_level - 1));
      IF remaining_xp >= level_xp THEN
        remaining_xp := remaining_xp - level_xp;
        new_level := new_level + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
    
    -- Insert or update user_experience
    INSERT INTO public.user_experience (user_id, total_xp, level, last_activity_date)
    VALUES (
      NEW.user_id, 
      total_xp,
      new_level,
      CURRENT_DATE
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_xp = total_xp,
      level = new_level,
      last_activity_date = CURRENT_DATE,
      streak_count = CASE 
        WHEN user_experience.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_experience.streak_count + 1
        WHEN user_experience.last_activity_date = CURRENT_DATE 
        THEN user_experience.streak_count
        ELSE 1
      END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;