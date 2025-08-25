-- Insert 4 new lessons for Основы ИИ course
INSERT INTO lessons (
  course_id,
  title,
  description,
  lesson_type,
  order_index,
  duration_minutes
) VALUES 
(
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  'Нейронные сети: основы',
  'Изучаем основные принципы работы нейронных сетей и их архитектуру',
  'slides',
  7,
  25
),
(
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  'Глубокое обучение в действии',
  'Практические примеры применения глубокого обучения в различных областях',
  'video',
  8,
  30
),
(
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  'Этика ИИ и ответственное развитие',
  'Обсуждаем этические вопросы и принципы ответственного развития ИИ',
  'reading',
  9,
  20
),
(
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  'Итоговая проверка знаний',
  'Финальный тест по всем темам курса "Основы ИИ"',
  'quiz',
  10,
  15
);

-- Update lessons count for the course
UPDATE courses 
SET lessons_count = 10 
WHERE id = '69c12d50-57f3-4a8b-92df-436451a05aee';