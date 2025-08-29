-- Create user_experience table for XP tracking
CREATE TABLE public.user_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_coins table for coins tracking
CREATE TABLE public.user_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_coins INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create system_settings table for economic configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all new tables
ALTER TABLE public.user_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_experience
CREATE POLICY "Users can view their own experience" 
ON public.user_experience 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experience" 
ON public.user_experience 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience" 
ON public.user_experience 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for user_coins
CREATE POLICY "Users can view their own coins" 
ON public.user_coins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coins" 
ON public.user_coins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins" 
ON public.user_coins 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for system_settings (read-only for all users)
CREATE POLICY "System settings are publicly readable" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('coin_multiplier', '3', 'Multiplier for AI API costs'),
('coin_to_usd_rate', '0.001', 'Conversion rate: 1 coin = X USD'),
('xp_per_lesson', '10', 'XP awarded per completed lesson'),
('coins_per_lesson', '10', 'Coins awarded per completed lesson'),
('free_tier_coin_limit', '50', 'Maximum coins for free tier users');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_experience_updated_at
BEFORE UPDATE ON public.user_experience
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_coins_updated_at
BEFORE UPDATE ON public.user_coins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update user experience when lesson is completed
CREATE OR REPLACE FUNCTION public.update_user_experience()
RETURNS TRIGGER AS $$
DECLARE
  xp_reward INTEGER;
  new_level INTEGER;
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
    
    -- Calculate new level (every 100 XP = 1 level)
    new_level := FLOOR((COALESCE((SELECT total_xp FROM public.user_experience WHERE user_id = NEW.user_id), 0) + xp_reward) / 100) + 1;
    
    -- Insert or update user_experience
    INSERT INTO public.user_experience (user_id, total_xp, level, last_activity_date)
    VALUES (
      NEW.user_id, 
      xp_reward,
      new_level,
      CURRENT_DATE
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_xp = user_experience.total_xp + xp_reward,
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
$$ LANGUAGE plpgsql;

-- Function to update user coins when lesson is completed
CREATE OR REPLACE FUNCTION public.update_user_coins()
RETURNS TRIGGER AS $$
DECLARE
  coin_reward INTEGER;
BEGIN
  -- Only update coins if lesson was just completed
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    -- Get coin reward from system settings
    SELECT (setting_value::TEXT)::INTEGER INTO coin_reward
    FROM public.system_settings 
    WHERE setting_key = 'coins_per_lesson';
    
    IF coin_reward IS NULL THEN
      coin_reward := 10; -- fallback default
    END IF;
    
    -- Insert or update user_coins
    INSERT INTO public.user_coins (user_id, total_coins, coins_earned)
    VALUES (
      NEW.user_id, 
      coin_reward,
      coin_reward
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_coins = user_coins.total_coins + coin_reward,
      coins_earned = user_coins.coins_earned + coin_reward,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for lesson completion
CREATE TRIGGER update_user_experience_on_lesson_complete
AFTER INSERT OR UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_user_experience();

CREATE TRIGGER update_user_coins_on_lesson_complete
AFTER INSERT OR UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_user_coins();

-- Migrate existing data from user_points to user_coins
INSERT INTO public.user_coins (user_id, total_coins, coins_earned)
SELECT 
  user_id,
  total_points,
  total_points
FROM public.user_points
ON CONFLICT (user_id) DO NOTHING;

-- Calculate initial XP based on completed lessons
INSERT INTO public.user_experience (user_id, total_xp, level)
SELECT 
  up.user_id,
  COUNT(up.*) * 10 as total_xp,
  FLOOR(COUNT(up.*) * 10 / 100) + 1 as level
FROM public.user_progress up
WHERE up.completed = true
GROUP BY up.user_id
ON CONFLICT (user_id) DO NOTHING;