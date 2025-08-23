-- Delete all courses except the first one (keeping the one with lowest created_at)
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

-- Update the first course to be about AI fundamentals
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

-- Delete existing lessons for the course and create new ones
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

-- Add content for video lesson
INSERT INTO lesson_content (lesson_id, content_type, title, content, order_index) VALUES
(
  (SELECT id FROM lessons WHERE lesson_type = 'video' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'video',
  'Введение в ИИ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  1
);

-- Add content for slides lesson (multiple slides)
INSERT INTO lesson_content (lesson_id, content_type, title, content, order_index) VALUES
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'slide',
  'Что такое ИИ?',
  '# Искусственный интеллект\n\nИИ — это технология, позволяющая машинам выполнять задачи, которые обычно требуют человеческого интеллекта.\n\n## Основные возможности:\n- Обучение\n- Рассуждение\n- Решение проблем',
  1
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'slide',
  'Машинное обучение',
  '# Машинное обучение\n\nПодраздел ИИ, который позволяет системам автоматически учиться и улучшаться без явного программирования.\n\n## Типы:\n- Supervised Learning\n- Unsupervised Learning\n- Reinforcement Learning',
  2
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'slide',
  'Глубокое обучение',
  '# Глубокое обучение\n\nИспользует искусственные нейронные сети для моделирования и понимания сложных паттернов.\n\n## Применения:\n- Распознавание изображений\n- Обработка языка\n- Автономные автомобили',
  3
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'slide',
  'Будущее ИИ',
  '# Будущее ИИ\n\nИИ продолжает развиваться и находить новые применения в различных сферах жизни.\n\n## Тренды:\n- Генеративный ИИ\n- Этичный ИИ\n- ИИ в повседневной жизни',
  4
);

-- Add content for quiz lesson
INSERT INTO lesson_content (lesson_id, content_type, title, content, order_index) VALUES
(
  (SELECT id FROM lessons WHERE lesson_type = 'quiz' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'question',
  'Вопрос 1',
  '{"question": "Что означает ИИ?", "options": ["Искусственный интеллект", "Интернет информации", "Интерактивный интерфейс", "Индустриальная инженерия"], "correct": 0}',
  1
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'quiz' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'question',
  'Вопрос 2',
  '{"question": "Какой тип обучения использует награды и наказания?", "options": ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Deep Learning"], "correct": 2}',
  2
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'quiz' AND course_id = (SELECT id FROM courses ORDER BY created_at LIMIT 1)),
  'question',
  'Вопрос 3',
  '{"question": "Что НЕ является применением глубокого обучения?", "options": ["Распознавание изображений", "Обработка языка", "Калькулятор", "Автономные автомобили"], "correct": 2}',
  3
);