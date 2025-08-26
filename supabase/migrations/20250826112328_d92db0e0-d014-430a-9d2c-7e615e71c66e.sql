-- Add order_index and badges to courses table
ALTER TABLE public.courses 
ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0,
ADD COLUMN badges TEXT[] DEFAULT '{}';

-- Update existing courses with order and badges
UPDATE public.courses 
SET order_index = 1, 
    badges = ARRAY['Основы', 'Для начинающих', 'Теория']
WHERE title = 'Основы ИИ';

-- Add a second course as example
INSERT INTO public.courses (
  title, 
  description, 
  lessons_count, 
  duration_hours, 
  difficulty, 
  icon, 
  color, 
  bg_color,
  order_index,
  badges
) VALUES (
  'Изучение фондового рынка',
  'Изучите основы инвестирования и торговли на фондовом рынке',
  8,
  12,
  'Начинающий',
  'TrendingUp',
  'text-green-600',
  'bg-green-50',
  2,
  ARRAY['Инвестиции', 'Финансы', 'Практика']
);

-- Add chapters for the new course
INSERT INTO public.chapters (course_id, title, description, order_index)
SELECT 
  c.id,
  'Фондовый рынок',
  'Основы работы с акциями и облигациями',
  0
FROM public.courses c 
WHERE c.title = 'Изучение фондового рынка';

INSERT INTO public.chapters (course_id, title, description, order_index)
SELECT 
  c.id,
  'Базовые инвестиции',
  'Стратегии и принципы инвестирования',
  1
FROM public.courses c 
WHERE c.title = 'Изучение фондового рынка';