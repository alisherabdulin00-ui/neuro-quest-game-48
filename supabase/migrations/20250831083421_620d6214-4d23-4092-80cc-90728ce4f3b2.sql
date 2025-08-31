-- Create table to track user attempts per lesson block
CREATE TABLE public.user_lesson_block_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_block_id UUID NOT NULL,
  attempts_used INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_block_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_lesson_block_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own lesson block attempts" 
ON public.user_lesson_block_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson block attempts" 
ON public.user_lesson_block_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson block attempts" 
ON public.user_lesson_block_attempts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_lesson_block_attempts_updated_at
BEFORE UPDATE ON public.user_lesson_block_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();