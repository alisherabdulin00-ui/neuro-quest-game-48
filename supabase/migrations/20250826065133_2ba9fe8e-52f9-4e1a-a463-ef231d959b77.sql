-- Create a new chapter "Нейронные сети" in the "Основы ИИ" course
INSERT INTO chapters (id, title, description, course_id, order_index) VALUES (
  gen_random_uuid(),
  'Нейронные сети',
  'Изучение основ нейронных сетей, их архитектуры и принципов работы',
  '69c12d50-57f3-4a8b-92df-436451a05aee',
  1
);

-- Get the chapter ID we just created (we'll use it for lessons)
-- Create lessons for the new chapter
INSERT INTO lessons (id, title, description, lesson_type, duration_minutes, chapter_id, order_index) VALUES 
-- Lesson 1: Introduction to Neural Networks
(gen_random_uuid(), 
 'Что такое нейронные сети?', 
 'Введение в концепцию нейронных сетей и их биологические основы',
 'video',
 15,
 (SELECT id FROM chapters WHERE title = 'Нейронные сети' AND course_id = '69c12d50-57f3-4a8b-92df-436451a05aee'),
 0),

-- Lesson 2: Neural Network Architecture  
(gen_random_uuid(),
 'Архитектура нейронных сетей',
 'Изучение основных компонентов: нейроны, слои, веса и функции активации',
 'reading',
 20,
 (SELECT id FROM chapters WHERE title = 'Нейронные сети' AND course_id = '69c12d50-57f3-4a8b-92df-436451a05aee'),
 1),

-- Lesson 3: Forward Propagation
(gen_random_uuid(),
 'Прямое распространение',
 'Как информация проходит через нейронную сеть от входа к выходу',
 'video',
 18,
 (SELECT id FROM chapters WHERE title = 'Нейронные сети' AND course_id = '69c12d50-57f3-4a8b-92df-436451a05aee'),
 2),

-- Lesson 4: Activation Functions
(gen_random_uuid(),
 'Функции активации',
 'Изучение различных функций активации: ReLU, Sigmoid, Tanh и их применение',
 'reading',
 25,
 (SELECT id FROM chapters WHERE title = 'Нейронные сети' AND course_id = '69c12d50-57f3-4a8b-92df-436451a05aee'),
 3),

-- Lesson 5: Backpropagation
(gen_random_uuid(),
 'Обратное распространение ошибки',
 'Алгоритм обучения нейронных сетей через обратное распространение',
 'video',
 22,
 (SELECT id FROM chapters WHERE title = 'Нейронные сети' AND course_id = '69c12d50-57f3-4a8b-92df-436451a05aee'),
 4),

-- Lesson 6: Practice Quiz
(gen_random_uuid(),
 'Тест: Основы нейронных сетей',
 'Проверьте свои знания по основам нейронных сетей',
 'quiz',
 10,
 (SELECT id FROM chapters WHERE title = 'Нейронные сети' AND course_id = '69c12d50-57f3-4a8b-92df-436451a05aee'),
 5);