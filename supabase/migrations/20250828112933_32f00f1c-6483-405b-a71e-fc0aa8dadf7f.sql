-- Add points field to lessons table
ALTER TABLE public.lessons 
ADD COLUMN points integer NOT NULL DEFAULT 10;

-- Create user_points table to track total points
CREATE TABLE public.user_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Create policies for user_points
CREATE POLICY "Users can view their own points" 
ON public.user_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points" 
ON public.user_points 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points" 
ON public.user_points 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add points field to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN points_earned integer NOT NULL DEFAULT 0;

-- Create function to update user total points
CREATE OR REPLACE FUNCTION public.update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user_points table
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (
    NEW.user_id, 
    NEW.points_earned
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + NEW.points_earned,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update total points when lesson is completed
CREATE TRIGGER update_total_points_on_completion
  AFTER INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed IS DISTINCT FROM true)
  EXECUTE FUNCTION public.update_user_total_points();

-- Add trigger for updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();