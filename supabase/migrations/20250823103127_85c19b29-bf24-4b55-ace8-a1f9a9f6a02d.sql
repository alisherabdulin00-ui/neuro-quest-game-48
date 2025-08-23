-- Add test progress record for the first lesson
INSERT INTO user_progress (user_id, lesson_id, progress_percentage, completed, completed_at)
VALUES ('4ed36dfb-1cbb-48c9-94cc-536bf6904a46', '36150023-190c-483f-9ec0-ba7aa513539b', 100, true, now())
ON CONFLICT (user_id, lesson_id) DO UPDATE SET
  progress_percentage = EXCLUDED.progress_percentage,
  completed = EXCLUDED.completed,
  completed_at = EXCLUDED.completed_at,
  updated_at = now();