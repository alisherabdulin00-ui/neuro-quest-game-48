-- Insert 3 new lessons for the "Основы ИИ" course
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
  'Машинное обучение vs ИИ',
  'Разбираем различия между машинным обучением и искусственным интеллектом',
  'slides',
  4,
  12
),
(
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  'История развития ИИ',
  'Путешествие от идеи до современных технологий',
  'video',
  5,
  15
),
(
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  'Применение ИИ в жизни',
  'Примеры использования ИИ в повседневной жизни и бизнесе',
  'reading',
  6,
  10
);

-- Update the lessons count in the course
UPDATE courses 
SET lessons_count = 6 
WHERE id = '69c12d50-57f3-4a8b-92df-436451a05aee';