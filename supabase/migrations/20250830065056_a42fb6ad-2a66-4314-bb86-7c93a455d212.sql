-- Add missing system settings for XP and level calculations
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('xp_per_correct_answer', '2', 'XP awarded for each correct answer in practice/quiz'),
('xp_streak_bonus', '5', 'XP multiplier per streak day for daily bonus'),
('level_base_xp', '100', 'Base XP required for first level (Level 1 → 2)'),
('level_growth_factor', '1.5', 'Exponential growth factor for each subsequent level')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();