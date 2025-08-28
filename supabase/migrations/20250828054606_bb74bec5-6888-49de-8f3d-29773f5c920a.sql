-- Create a new lesson_blocks table for unified block-based lessons
CREATE TABLE public.lesson_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('theory', 'practice', 'video')),
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Lesson blocks are publicly readable" 
ON public.lesson_blocks 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lesson_blocks_updated_at
BEFORE UPDATE ON public.lesson_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_lesson_blocks_lesson_id ON public.lesson_blocks(lesson_id);
CREATE INDEX idx_lesson_blocks_order ON public.lesson_blocks(lesson_id, order_index);