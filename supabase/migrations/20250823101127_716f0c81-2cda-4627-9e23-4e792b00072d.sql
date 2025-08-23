-- First, let's check what lesson types are currently allowed and update the constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

-- Add a new constraint that allows video, slides, and quiz types
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check 
CHECK (lesson_type IN ('video', 'reading', 'quiz', 'slides'));

-- Now delete all courses except the first one
WITH first_course AS (
  SELECT id FROM courses ORDER BY created_at LIMIT 1
)
DELETE FROM user_progress 
WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  WHERE l.course_id NOT IN (SELECT id FROM first_course)
);

-- Delete lesson content for lessons not in first course
WITH first_course AS (
  SELECT id FROM courses ORDER BY created_at LIMIT 1
)
DELETE FROM lesson_content 
WHERE lesson_id IN (
  SELECT l.id FROM lessons l 
  WHERE l.course_id NOT IN (SELECT id FROM first_course)
);

-- Delete lessons not in first course
WITH first_course AS (
  SELECT id FROM courses ORDER BY created_at LIMIT 1
)
DELETE FROM lessons 
WHERE course_id NOT IN (SELECT id FROM first_course);

-- Delete courses except first one
WITH first_course AS (
  SELECT id FROM courses ORDER BY created_at LIMIT 1
)
DELETE FROM courses 
WHERE id NOT IN (SELECT id FROM first_course);

-- Update the first course
UPDATE courses 
SET 
  title = 'Основы ИИ',
  description = 'Изучите основы искусственного интеллекта через видео, интерактивные слайды и тесты',
  difficulty = 'Начинающий',
  duration_hours = 2,
  lessons_count = 3,
  icon = '🤖',
  color = 'blue',
  bg_color = 'from-blue-500 to-purple-600'
WHERE id = (SELECT id FROM courses ORDER BY created_at LIMIT 1);

-- Delete existing lessons for the course
DELETE FROM lesson_content WHERE lesson_id IN (
  SELECT id FROM lessons WHERE course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)
);

DELETE FROM lessons WHERE course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1);

-- Create 3 new lessons with different types
INSERT INTO lessons (course_id, title, description, lesson_type, order_index, duration_minutes) VALUES
(
  (SELECT id FROM courses ORDER BY created_at LIMIT 1),
  'Что такое ИИ?',
  'Введение в искусственный интеллект через короткое видео',
  'video',
  1,
  5
),
(
  (SELECT id FROM courses ORDER BY created_at LIMIT 1),
  'Типы ИИ',
  'Интерактивные слайды о различных типах искусственного интеллекта',
  'slides',
  2,
  10
),
(
  (SELECT id FROM courses ORDER BY created_at LIMIT 1),
  'Проверь себя',
  'Тест на понимание основ ИИ',
  'quiz',
  3,
  8
);