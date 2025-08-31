import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, ArrowPathIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
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

interface TaskEvaluation {
  success: boolean;
  score: number;
  feedback: string;
  improvements: string[];
  strengths: string[];
}

interface ChatbotTask {
  id: string;
  title: string;
  description: string;
  prompt: string;
  successCriteria: string[];
  maxAttempts: number;
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
  task?: ChatbotTask;
}

interface ChatbotBlockProps {
  block: LessonBlock;
  onNext: () => void;
  isLastBlock: boolean;
  onComplete: () => void;
}

export const ChatbotBlock = ({ block, onNext, isLastBlock, onComplete }: ChatbotBlockProps) => {
  // Add null safety check for block.content
  if (!block || !block.content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const data: ChatbotData = block.content;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [currentEvaluation, setCurrentEvaluation] = useState<TaskEvaluation | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const hasTask = data?.task;
  const maxAttempts = data?.task?.maxAttempts || 3;
  const minInteractions = data?.minInteractions || 3;
  const canComplete = hasTask ? taskCompleted : interactionCount >= minInteractions;
  const attemptsRemaining = maxAttempts - attemptsUsed;

  // Get current user and fetch attempts
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user?.id && hasTask) {
        await fetchUserAttempts(user.id);
      }
    };
    getUser();
  }, [hasTask, block.id]);

  // Fetch user attempts for this lesson block
  const fetchUserAttempts = async (userIdParam: string) => {
    try {
      const { data, error } = await supabase
        .from('user_lesson_block_attempts')
        .select('attempts_used, completed, feedback_data')
        .eq('user_id', userIdParam)
        .eq('lesson_block_id', block.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching attempts:', error);
        return;
      }

      if (data) {
        setAttemptsUsed(data.attempts_used);
        setTaskCompleted(data.completed);
        if (data.feedback_data) {
          setCurrentEvaluation(data.feedback_data as unknown as TaskEvaluation);
        }
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  // Update attempts in database
  const updateUserAttempts = async (attemptsCount: number, isCompleted: boolean = false, feedbackData: TaskEvaluation | null = null) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_lesson_block_attempts')
        .upsert({
          user_id: userId,
          lesson_block_id: block.id,
          attempts_used: attemptsCount,
          completed: isCompleted,
          feedback_data: feedbackData as any,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating attempts:', error);
      }
    } catch (error) {
      console.error('Error updating attempts:', error);
    }
  };

  // Add initial message if provided (only for non-task chatbots)
  useEffect(() => {
    if (!hasTask && data?.initialMessage) {
      const initialMsg: Message = {
        id: 'initial',
        type: 'assistant',
        content: data.initialMessage,
        timestamp: new Date()
      };
      setMessages([initialMsg]);
    }
  }, [data?.initialMessage, hasTask]);

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

    // Check attempts limit for task mode
    if (hasTask && attemptsUsed >= maxAttempts) {
      toast({
        title: "Попытки исчерпаны",
        description: `Вы использовали все ${maxAttempts} попыток для этого задания.`,
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
      
      // Step 1: Generate content
      const { data: contentResponse, error: contentError } = await supabase.functions.invoke('generate-content', {
        body: { 
          prompt: messageContent,
          model: data?.model || 'gpt-4o-mini',
          systemPrompt: hasTask ? 
            'Ты эксперт по созданию контента. Выполни точно то, что просит пользователь. Создай качественный, профессиональный контент согласно запросу. Отвечай на русском языке.' :
            (data?.systemPrompt || '')
        },
        headers: {
          authorization: `Bearer ${session?.access_token}`
        }
      });

      if (contentError) {
        let errorMsg = `Ошибка: ${contentError.message}`;
        
        if (contentError.message.includes('Недостаточно монет')) {
          const coinsMatch = contentError.message.match(/Требуется: (\d+), доступно: (\d+)/);
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
        return;
      }

      if (!contentResponse?.content) {
        throw new Error('No content received from AI');
      }

      // Add AI response with generated content
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: contentResponse.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setInteractionCount(prev => prev + 1);
      
      // Step 2: If task exists, evaluate the prompt and content
      if (hasTask && data?.task) {
        const { data: evaluationResponse, error: evaluationError } = await supabase.functions.invoke('evaluate-prompt', {
          body: { 
            prompt: messageContent,
            content: contentResponse.content,
            task: data.task,
            systemPrompt: data?.systemPrompt
          },
          headers: {
            authorization: `Bearer ${session?.access_token}`
          }
        });

        if (evaluationError) {
          console.error('Evaluation error:', evaluationError);
          // Continue without evaluation if it fails
        } else if (evaluationResponse?.evaluation) {
          const newAttemptsUsed = attemptsUsed + 1;
          setAttemptsUsed(newAttemptsUsed);
          
          const evaluation: TaskEvaluation = evaluationResponse.evaluation;
          setCurrentEvaluation(evaluation);
          setGeneratedContent(contentResponse.content);
          
          // Determine if task is completed based on evaluation score
          const isCompleted = evaluation.success || evaluation.score >= 8;
          if (isCompleted) {
            setTaskCompleted(true);
            await updateUserAttempts(newAttemptsUsed, true, evaluation);
            toast({
              title: "Задание выполнено!",
              description: `Отличная работа! Оценка: ${evaluation.score}/10`,
              variant: "default",
            });
          } else {
            await updateUserAttempts(newAttemptsUsed, false, evaluation);
            if (newAttemptsUsed >= maxAttempts) {
              toast({
                title: "Попытки исчерпаны",
                description: "Вы можете продолжить изучение следующего блока.",
                variant: "destructive",
              });
            } else {
              toast({
                title: `Оценка: ${evaluation.score}/10`,
                description: evaluation.score >= 5 ? "Хорошо! Можете улучшить или продолжить." : "Попробуйте улучшить промпт.",
                variant: evaluation.score >= 5 ? "default" : "destructive",
              });
            }
          }
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
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {hasTask ? (
          /* Task-based header */
          <div className="bg-card rounded-lg border p-4 mb-4 mx-4 mt-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">
                    Попытка {attemptsUsed} из {maxAttempts}
                  </div>
                </div>
                <h3 className="text-base font-medium text-orange-600 mb-2">{data.task.title}</h3>
                <p className="text-sm text-muted-foreground">{data.task.description}</p>
                
                {taskCompleted && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 dark:text-green-300 text-sm font-medium">Задание выполнено!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Regular chatbot header */
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-full">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{data?.title || 'Чат-бот'}</h2>
                <p className="text-sm text-muted-foreground">{data?.description || 'Описание недоступно'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {data?.model || 'gpt-4o-mini'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {interactionCount}/{minInteractions} взаимодействий
              </Badge>
            </div>
          </div>
        )}



        {/* Chat Messages */}
        <div className="px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-muted-foreground" />
              </div>
               <div>
                 <h3 className="text-lg font-semibold mb-2">
                   {hasTask ? 'Выполните задание' : 'Начните диалог'}
                 </h3>
                 <p className="text-muted-foreground text-sm">
                   {hasTask 
                     ? `У вас есть ${maxAttempts} попыток для выполнения задания`
                     : 'Задайте вопрос для начала изучения'
                   }
                 </p>
               </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                      <div className={`${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3'
                          : 'bg-muted/70 text-foreground rounded-2xl rounded-tl-sm px-4 py-3'
                      } shadow-sm`}>
                        <div className="prose prose-sm max-w-none text-inherit [&>*]:text-inherit [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-inherit [&>h2]:text-inherit [&>h3]:text-inherit [&>h4]:text-inherit [&>h5]:text-inherit [&>h6]:text-inherit [&>blockquote]:text-inherit [&>code]:text-inherit">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                      <div className={`text-xs text-muted-foreground mt-1 ${
                        message.type === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {message.timestamp.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show evaluation after assistant response in task mode */}
                  {hasTask && message.type === 'assistant' && index === messages.length - 1 && currentEvaluation && (
                    <div className="mt-4 ml-10">
                      <div className={`rounded-lg border p-4 ${
                        currentEvaluation.score >= 8 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                          : currentEvaluation.score >= 5 
                          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                              currentEvaluation.score >= 8 ? 'bg-green-600' : currentEvaluation.score >= 5 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {currentEvaluation.score}
                            </div>
                            Оценка работы
                          </h4>
                          <div className="text-lg font-semibold text-muted-foreground">
                            {currentEvaluation.score}/10
                          </div>
                        </div>
                        
                        <Collapsible open={showDetailedFeedback} onOpenChange={setShowDetailedFeedback}>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full mb-3">
                              {showDetailedFeedback ? (
                                <>
                                  Скрыть подробную оценку
                                  <ChevronUpIcon className="w-4 h-4 ml-2" />
                                </>
                              ) : (
                                <>
                                  Показать подробную оценку
                                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="space-y-3">
                            <p className={`text-sm ${
                              currentEvaluation.score >= 8 
                                ? 'text-green-700 dark:text-green-300' 
                                : currentEvaluation.score >= 5 
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {currentEvaluation.feedback}
                            </p>
                            
                            {currentEvaluation.strengths && currentEvaluation.strengths.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-green-600 mb-1">✓ Сильные стороны:</h5>
                                <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-300 space-y-1">
                                  {currentEvaluation.strengths.map((strength, idx) => (
                                    <li key={idx}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {currentEvaluation.improvements && currentEvaluation.improvements.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-orange-600 mb-1">→ Рекомендации:</h5>
                                <ul className="list-disc list-inside text-sm text-orange-700 dark:text-orange-300 space-y-1">
                                  {currentEvaluation.improvements.map((improvement, idx) => (
                                    <li key={idx}>{improvement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/70 text-foreground rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={scrollAreaRef} />
            </div>
          )}
        </div>
      </div>

      {/* Suggested Questions - Fixed at bottom */}
      {!hasTask && data?.suggestedQuestions && Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0 && messages.length <= 1 && (
        <div className="border-t border-border bg-muted/30 p-4">
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

      {/* Fixed Input and CTA Area */}
      <div className="border-t border-border bg-background p-4 flex-shrink-0">
        <div className="relative mb-3">
          <div className="relative flex items-center bg-muted/50 border border-border rounded-3xl shadow-sm hover:shadow-md transition-all">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={hasTask && attemptsUsed >= maxAttempts ? "Попытки исчерпаны..." : "Напишите сообщение..."}
              disabled={isGenerating || (hasTask && attemptsUsed >= maxAttempts)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-12 py-3 text-sm placeholder:text-muted-foreground/60 min-h-[44px]"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isGenerating || (hasTask && attemptsUsed >= maxAttempts)}
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

        {/* Action Buttons for Task Mode */}
        {hasTask && currentEvaluation && (
          <div className="flex gap-3 mb-3">
            {attemptsRemaining > 0 && !taskCompleted && (
              <Button 
                variant="outline"
                onClick={() => {
                  setInputValue("");
                  setCurrentEvaluation(null);
                  setGeneratedContent("");
                  setMessages([]);
                  setShowDetailedFeedback(false);
                }}
                className="flex-1"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Попробовать снова ({attemptsRemaining})
              </Button>
            )}
            
            {isLastBlock ? (
              <Button 
                onClick={onComplete} 
                disabled={!canComplete}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Завершить урок
              </Button>
            ) : (
              <Button 
                onClick={onNext}
                disabled={!canComplete}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Продолжить
              </Button>
            )}
          </div>
        )}

        {/* Bottom Button for non-task mode */}
        {!hasTask && (
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
        )}
      </div>
    </div>
  );
};