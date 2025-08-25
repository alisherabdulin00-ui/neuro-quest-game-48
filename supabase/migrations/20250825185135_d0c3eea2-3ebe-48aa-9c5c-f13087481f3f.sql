-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chapters table
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Create policy for chapters to be publicly readable
CREATE POLICY "Chapters are publicly readable" 
ON public.chapters 
FOR SELECT 
USING (true);

-- Add chapter_id column to lessons table
ALTER TABLE public.lessons ADD COLUMN chapter_id UUID;

-- Create chapters for existing lessons (one chapter per course)
INSERT INTO public.chapters (course_id, title, description, order_index)
SELECT 
  id as course_id,
  'Chapter 1' as title,
  'Introduction to ' || title as description,
  1 as order_index
FROM public.courses;

-- Update lessons to reference chapters instead of courses
UPDATE public.lessons 
SET chapter_id = (
  SELECT chapters.id 
  FROM public.chapters 
  WHERE chapters.course_id = lessons.course_id
  LIMIT 1
);

-- Make chapter_id NOT NULL now that we've populated it
ALTER TABLE public.lessons ALTER COLUMN chapter_id SET NOT NULL;

-- Remove the old course_id column from lessons
ALTER TABLE public.lessons DROP COLUMN course_id;

-- Create trigger for updating timestamps on chapters
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();