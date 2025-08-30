import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LessonBlock } from "./BlockRenderer";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotData {
  title: string;
  description: string;
  model: string;
  systemPrompt: string;
  allowedCapabilities: ('text' | 'image' | 'video')[];
  initialMessage?: string;
  suggestedQuestions?: string[];
  minInteractions?: number;
}

interface ChatbotBlockProps {
  block: LessonBlock;
  onNext: () => void;
  isLastBlock: boolean;
  onComplete: () => void;
}

export const ChatbotBlock = ({ block, onNext, isLastBlock, onComplete }: ChatbotBlockProps) => {
  const data: ChatbotData = block.content;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const minInteractions = data.minInteractions || 3;
  const canComplete = interactionCount >= minInteractions;

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Add initial message if provided
  useEffect(() => {
    if (data.initialMessage) {
      const initialMsg: Message = {
        id: 'initial',
        type: 'assistant',
        content: data.initialMessage,
        timestamp: new Date()
      };
      setMessages([initialMsg]);
    }
  }, [data.initialMessage]);

  const scrollToBottom = () => {
    scrollAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isGenerating) return;

    if (!userId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для использования AI",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create context with system prompt and conversation history
      const contextMessages = [
        { role: 'system', content: data.systemPrompt },
        ...messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: messageContent }
      ];

      const { data: response, error } = await supabase.functions.invoke('generate-text', {
        body: { 
          prompt: messageContent,
          model: data.model,
          systemPrompt: data.systemPrompt,
          context: contextMessages
        },
        headers: {
          authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        let errorMsg = `Ошибка: ${error.message}`;
        
        if (error.message.includes('Недостаточно монет')) {
          const coinsMatch = error.message.match(/Требуется: (\d+), доступно: (\d+)/);
          if (coinsMatch) {
            errorMsg = `Недостаточно монет для этого запроса. Требуется: ${coinsMatch[1]}, у вас: ${coinsMatch[2]}`;
            toast({
              title: "Недостаточно монет",
              description: "Выполните уроки чтобы заработать монеты или перейдите на Pro",
              variant: "destructive",
            });
          }
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: errorMsg,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setInteractionCount(prev => prev + 1);

        // Show coins deducted notification
        if (response.coinsDeducted > 0) {
          toast({
            title: `Списано ${response.coinsDeducted} монет`,
            description: `Остаток: ${response.remainingCoins} монет`,
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Произошла ошибка при генерации ответа.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/20 rounded-full">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{data.title}</h2>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {data.model}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {interactionCount}/{minInteractions} взаимодействий
          </Badge>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Начните диалог</h3>
                  <p className="text-muted-foreground text-sm">Задайте вопрос для начала изучения</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`${
                      message.type === 'user' 
                        ? 'max-w-[80%] sm:max-w-[70%]' 
                        : 'max-w-[85%] sm:max-w-[75%] flex-1'
                    }`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.type === 'assistant' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:m-0 prose-p:mb-2 prose-p:last:mb-0">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                      </div>
                    </div>
                    {message.type === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs font-medium">Вы</span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={scrollAreaRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Suggested Questions */}
      {data.suggestedQuestions && data.suggestedQuestions.length > 0 && messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Рекомендуемые вопросы:</p>
          <div className="flex flex-wrap gap-2">
            {data.suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isGenerating}
                className="text-xs h-auto py-1 px-2 rounded-full"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="relative mb-3">
          <div className="relative flex items-center bg-muted/50 border border-border rounded-3xl shadow-sm hover:shadow-md transition-all">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              disabled={isGenerating}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-12 py-3 text-sm placeholder:text-muted-foreground/60 min-h-[44px]"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isGenerating}
              size="icon"
              variant="ghost"
              className="absolute right-2 h-7 w-7 rounded-full hover:bg-muted disabled:opacity-50"
            >
              {isGenerating ? (
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="flex justify-center">
          {isLastBlock ? (
            <Button 
              onClick={onComplete} 
              disabled={!canComplete}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-12 py-4 text-lg font-bold rounded-xl border-none shadow-[0px_4px_0px_0px] shadow-indigo-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-600 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {canComplete ? 'Завершить урок' : `Еще ${minInteractions - interactionCount} взаимодействий`}
            </Button>
          ) : (
            <Button 
              onClick={onNext}
              disabled={!canComplete}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-16 py-4 text-lg font-bold border-none shadow-[0px_4px_0px_0px] shadow-indigo-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-600 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canComplete ? 'Продолжить' : `Еще ${minInteractions - interactionCount} взаимодействий`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};