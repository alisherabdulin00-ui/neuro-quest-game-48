-- Add feedback_data column to user_lesson_block_attempts table
ALTER TABLE user_lesson_block_attempts 
ADD COLUMN feedback_data JSONB DEFAULT NULL;

COMMENT ON COLUMN user_lesson_block_attempts.feedback_data IS 'Stores AI evaluation feedback and scoring data for chatbot tasks';