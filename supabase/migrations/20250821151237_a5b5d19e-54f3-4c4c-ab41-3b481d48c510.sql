-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Начинающий', 'Средний', 'Продвинутый')),
  duration_hours INTEGER NOT NULL,
  lessons_count INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('theory', 'practice', 'mixed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson content table
CREATE TABLE public.lesson_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('theory', 'practice', 'quiz')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress table (for future authentication)
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for courses (public read)
CREATE POLICY "Courses are publicly readable" 
ON public.courses 
FOR SELECT 
USING (true);

-- Create policies for lessons (public read)
CREATE POLICY "Lessons are publicly readable" 
ON public.lessons 
FOR SELECT 
USING (true);

-- Create policies for lesson content (public read)
CREATE POLICY "Lesson content is publicly readable" 
ON public.lesson_content 
FOR SELECT 
USING (true);

-- Create policies for user progress (user-specific)
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses
INSERT INTO public.courses (title, description, icon, difficulty, duration_hours, lessons_count, color, bg_color) VALUES
('Основы LLM', 'Изучите принципы работы больших языковых моделей и их применение в современных задачах', '🧠', 'Начинающий', 8, 12, 'text-blue-600', 'bg-blue-50'),
('Мастерство ChatGPT', 'Освойте продвинутые техники работы с ChatGPT для максимальной эффективности', '💬', 'Средний', 6, 10, 'text-green-600', 'bg-green-50'),
('Генерация изображений с Midjourney', 'Создавайте потрясающие изображения с помощью ИИ и изучите секреты промптинга', '🎨', 'Средний', 10, 15, 'text-purple-600', 'bg-purple-50'),
('Видео будущего с Veo3', 'Освойте новейшую модель генерации видео от Google и создавайте контент нового уровня', '🎬', 'Продвинутый', 12, 18, 'text-red-600', 'bg-red-50'),
('Автоматизация с Make', 'Создавайте мощные автоматизации и интеграции без программирования', '⚙️', 'Начинающий', 5, 8, 'text-orange-600', 'bg-orange-50');

-- Insert sample lessons for LLM course
INSERT INTO public.lessons (course_id, title, description, order_index, duration_minutes, lesson_type) 
SELECT 
  c.id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index,
  lesson_data.duration_minutes,
  lesson_data.lesson_type
FROM public.courses c
CROSS JOIN (VALUES
  ('Что такое LLM?', 'Введение в большие языковые модели и их возможности', 1, 30, 'theory'),
  ('Архитектура трансформеров', 'Понимание основ архитектуры, лежащей в основе современных LLM', 2, 45, 'theory'),
  ('Практика: первые запросы', 'Учимся формулировать эффективные промпты', 3, 40, 'practice'),
  ('Токенизация и контекст', 'Как модели обрабатывают текст и работают с контекстом', 4, 35, 'theory')
) AS lesson_data(title, description, order_index, duration_minutes, lesson_type)
WHERE c.title = 'Основы LLM';

-- Insert sample lessons for ChatGPT course
INSERT INTO public.lessons (course_id, title, description, order_index, duration_minutes, lesson_type)
SELECT 
  c.id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index,
  lesson_data.duration_minutes,
  lesson_data.lesson_type
FROM public.courses c
CROSS JOIN (VALUES
  ('Введение в ChatGPT', 'История развития и основные возможности ChatGPT', 1, 25, 'theory'),
  ('Техники промптинга', 'Изучаем продвинутые методы составления запросов', 2, 50, 'mixed'),
  ('Практика: решение задач', 'Применяем ChatGPT для решения реальных задач', 3, 60, 'practice')
) AS lesson_data(title, description, order_index, duration_minutes, lesson_type)
WHERE c.title = 'Мастерство ChatGPT';

-- Insert sample lesson content
INSERT INTO public.lesson_content (lesson_id, content_type, title, content, order_index)
SELECT 
  l.id,
  'theory',
  'Основы LLM',
  'Большие языковые модели (Large Language Models, LLM) — это тип искусственного интеллекта, обученный на огромных объемах текстовых данных. Они способны понимать и генерировать человеческий язык, выполнять различные задачи обработки естественного языка.

Ключевые особенности LLM:
• Обучение на миллиардах параметров
• Способность к контекстному пониманию
• Многозадачность без дополнительного обучения
• Эмерджентные способности при увеличении масштаба

LLM используются в:
- Чат-ботах и виртуальных ассистентах
- Переводе текстов
- Написании и редактировании контента
- Анализе данных и исследованиях
- Программировании и отладке кода',
  1
FROM public.lessons l
JOIN public.courses c ON l.course_id = c.id
WHERE c.title = 'Основы LLM' AND l.title = 'Что такое LLM?';