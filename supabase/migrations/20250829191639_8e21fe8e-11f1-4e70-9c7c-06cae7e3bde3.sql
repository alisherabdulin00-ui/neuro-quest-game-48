-- Create ai_usage_log table to track AI requests
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  coins_deducted INTEGER NOT NULL DEFAULT 0,
  multiplier DECIMAL(3,1) NOT NULL DEFAULT 3.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table for tiers
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'intermediate', 'pro')),
  max_coins INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_usage_log
CREATE POLICY "Users can view their own AI usage" 
ON public.ai_usage_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage" 
ON public.ai_usage_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_usage_log_user_id ON public.ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log(created_at);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Add trigger for user_subscriptions updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize user subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, max_coins)
  VALUES (NEW.id, 'free', 50);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;