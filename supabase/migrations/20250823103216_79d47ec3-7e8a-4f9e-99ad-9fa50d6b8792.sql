-- Add unique constraint to prevent duplicate progress records
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_unique_user_lesson 
UNIQUE (user_id, lesson_id);