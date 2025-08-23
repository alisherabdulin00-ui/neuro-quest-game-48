-- First delete all existing data to avoid constraint violations
DELETE FROM user_progress;
DELETE FROM lesson_content;
DELETE FROM lessons;
DELETE FROM courses;

-- Drop the existing constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

-- Add new constraint that allows our lesson types
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check 
CHECK (lesson_type IN ('video', 'slides', 'quiz', 'reading'));

-- Create the AI fundamentals course
INSERT INTO courses (title, description, difficulty, duration_hours, lessons_count, icon, color, bg_color) VALUES
('Основы ИИ', 'Изучите основы искусственного интеллекта через видео, интерактивные слайды и тесты', 'Начинающий', 2, 3, '🤖', 'blue', 'from-blue-500 to-purple-600');

-- Create 3 lessons with different types
INSERT INTO lessons (course_id, title, description, lesson_type, order_index, duration_minutes) VALUES
(
  (SELECT id FROM courses LIMIT 1),
  'Что такое ИИ?',
  'Введение в искусственный интеллект через короткое видео',
  'video',
  1,
  5
),
(
  (SELECT id FROM courses LIMIT 1),
  'Типы ИИ',
  'Интерактивные слайды о различных типах искусственного интеллекта',
  'slides',
  2,
  10
),
(
  (SELECT id FROM courses LIMIT 1),
  'Проверь себя',
  'Тест на понимание основ ИИ',
  'quiz',
  3,
  8
);

-- Add content for video lesson
INSERT INTO lesson_content (lesson_id, content_type, title, content, order_index) VALUES
(
  (SELECT id FROM lessons WHERE lesson_type = 'video' LIMIT 1),
  'video',
  'Введение в ИИ',
  'https://www.youtube.com/embed/F1ka6a13S9I',
  1
);

-- Add content for slides lesson (4 slides)
INSERT INTO lesson_content (lesson_id, content_type, title, content, order_index) VALUES
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' LIMIT 1),
  'slide',
  'Что такое ИИ?',
  '{"title": "Искусственный интеллект", "content": "ИИ — это технология, позволяющая машинам выполнять задачи, которые обычно требуют человеческого интеллекта.", "points": ["Обучение", "Рассуждение", "Решение проблем"]}',
  1
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' LIMIT 1),
  'slide',
  'Машинное обучение',
  '{"title": "Машинное обучение", "content": "Подраздел ИИ, который позволяет системам автоматически учиться и улучшаться без явного программирования.", "points": ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"]}',
  2
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' LIMIT 1),
  'slide',
  'Глубокое обучение',
  '{"title": "Глубокое обучение", "content": "Использует искусственные нейронные сети для моделирования и понимания сложных паттернов.", "points": ["Распознавание изображений", "Обработка языка", "Автономные автомобили"]}',
  3
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'slides' LIMIT 1),
  'slide',
  'Будущее ИИ',
  '{"title": "Будущее ИИ", "content": "ИИ продолжает развиваться и находить новые применения в различных сферах жизни.", "points": ["Генеративный ИИ", "Этичный ИИ", "ИИ в повседневной жизни"]}',
  4
);

-- Add content for quiz lesson (3 questions)
INSERT INTO lesson_content (lesson_id, content_type, title, content, order_index) VALUES
(
  (SELECT id FROM lessons WHERE lesson_type = 'quiz' LIMIT 1),
  'question',
  'Вопрос 1',
  '{"question": "Что означает ИИ?", "options": ["Искусственный интеллект", "Интернет информации", "Интерактивный интерфейс", "Индустриальная инженерия"], "correct": 0}',
  1
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'quiz' LIMIT 1),
  'question',
  'Вопрос 2',
  '{"question": "Какой тип обучения использует награды и наказания?", "options": ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Deep Learning"], "correct": 2}',
  2
),
(
  (SELECT id FROM lessons WHERE lesson_type = 'quiz' LIMIT 1),
  'question',
  'Вопрос 3',
  '{"question": "Что НЕ является применением глубокого обучения?", "options": ["Распознавание изображений", "Обработка языка", "Калькулятор", "Автономные автомобили"], "correct": 2}',
  3
);