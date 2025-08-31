import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, ArrowPathIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, UserIcon, SparklesIcon, StarIcon } from "@heroicons/react/24/solid";
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
export const ChatbotBlock = ({
  block,
  onNext,
  isLastBlock,
  onComplete
}: ChatbotBlockProps) => {
  // Add null safety check for block.content
  if (!block || !block.content) {
    return <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
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
  const {
    toast
  } = useToast();
  const hasTask = data?.task;
  const maxAttempts = data?.task?.maxAttempts || 3;
  const minInteractions = data?.minInteractions || 3;
  const canComplete = hasTask ? taskCompleted : interactionCount >= minInteractions;
  const attemptsRemaining = maxAttempts - attemptsUsed;

  // Get current user and fetch attempts
  useEffect(() => {
    const getUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
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
      const {
        data,
        error
      } = await supabase.from('user_lesson_block_attempts').select('attempts_used, completed, feedback_data').eq('user_id', userIdParam).eq('lesson_block_id', block.id).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
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
      const {
        error
      } = await supabase.from('user_lesson_block_attempts').upsert({
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
    scrollAreaRef.current?.scrollIntoView({
      behavior: "smooth"
    });
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
        variant: "destructive"
      });
      return;
    }

    // Check attempts limit for task mode
    if (hasTask && attemptsUsed >= maxAttempts) {
      toast({
        title: "Попытки исчерпаны",
        description: `Вы использовали все ${maxAttempts} попыток для этого задания.`,
        variant: "destructive"
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();

      // Step 1: Generate content
      const {
        data: contentResponse,
        error: contentError
      } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: messageContent,
          model: data?.model || 'gpt-4o-mini',
          systemPrompt: hasTask ? 'Ты эксперт по созданию контента. Выполни точно то, что просит пользователь. Создай качественный, профессиональный контент согласно запросу. Отвечай на русском языке.' : data?.systemPrompt || ''
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
              variant: "destructive"
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
        const {
          data: evaluationResponse,
          error: evaluationError
        } = await supabase.functions.invoke('evaluate-prompt', {
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
              variant: "default"
            });
          } else {
            await updateUserAttempts(newAttemptsUsed, false, evaluation);
            if (newAttemptsUsed >= maxAttempts) {
              toast({
                title: "Попытки исчерпаны",
                description: "Вы можете продолжить изучение следующего блока.",
                variant: "destructive"
              });
            } else {
              toast({
                title: `Оценка: ${evaluation.score}/10`,
                description: evaluation.score >= 5 ? "Хорошо! Можете улучшить или продолжить." : "Попробуйте улучшить промпт.",
                variant: evaluation.score >= 5 ? "default" : "destructive"
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
  return <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <div className="w-full max-h-full overflow-y-auto px-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2 text-indigo-600" />
              {hasTask ? 'ПРАКТИКА ПРОМПТИНГА' : 'ЧАТ С AI'}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-2">
              {hasTask ? data?.task?.title : data?.title || 'Чат-бот'}
            </h1>
            <p className="text-lg text-gray-600">
              {hasTask ? data?.task?.description : data?.description || 'Описание недоступно'}
            </p>
            {hasTask && <div className="mt-3 text-sm text-gray-500">
                Попытка {attemptsUsed} из {maxAttempts}
              </div>}
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 mb-6">
            {/* System Introduction */}
            {data?.systemPrompt && !hasTask && <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0px_4px_0px_0px] shadow-gray-200 p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-800 font-medium">{data.systemPrompt}</p>
                  </div>
                </div>
              </div>}

            {/* Empty state */}
            {messages.length === 0 && <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {hasTask ? 'Выполните задание' : 'Начните диалог'}
                </h3>
                <p className="text-gray-600">
                  {hasTask ? `У вас есть ${maxAttempts} попыток для выполнения задания` : 'Задайте вопрос для начала изучения'}
                </p>
              </div>}

            {/* Chat Messages */}
            {messages.map((message, index) => <div key={message.id} className={`${message.type === 'user' ? 'ml-8' : 'mr-8'}`}>
                <div className={`rounded-2xl border-2 p-6 shadow-[0px_4px_0px_0px] ${message.type === 'user' ? 'bg-indigo-50 border-indigo-200 shadow-indigo-200' : 'bg-white border-gray-200 shadow-gray-200'}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user' ? 'bg-indigo-200' : 'bg-green-100'}`}>
                      {message.type === 'user' ? <UserIcon className="w-5 h-5 text-indigo-700" /> : <SparklesIcon className="w-5 h-5 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-lg font-medium ${message.type === 'user' ? 'text-indigo-800' : 'text-gray-800'}`}>
                        <div className="prose prose-lg max-w-none text-inherit [&>*]:text-inherit [&>p]:mb-2 [&>p:last-child]:mb-0">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString('ru', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Show evaluation for assistant messages in task mode */}
                {hasTask && message.type === 'assistant' && index === messages.length - 1 && currentEvaluation && <div className="mt-4 mr-8">
                    <div className={`rounded-2xl border-2 p-6 shadow-[0px_4px_0px_0px] ${currentEvaluation.score >= 8 ? 'bg-green-50 border-green-200 shadow-green-200' : currentEvaluation.score >= 5 ? 'bg-yellow-50 border-yellow-200 shadow-yellow-200' : 'bg-red-50 border-red-200 shadow-red-200'}`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${currentEvaluation.score >= 8 ? 'bg-green-600' : currentEvaluation.score >= 5 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                          {currentEvaluation.score}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">Оценка работы</h4>
                          <p className="text-lg text-gray-600">{currentEvaluation.score}/10</p>
                        </div>
                      </div>
                      
                      <p className={`text-lg font-medium mb-4 ${currentEvaluation.score >= 8 ? 'text-green-700' : currentEvaluation.score >= 5 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {currentEvaluation.feedback}
                      </p>
                      
                      {(currentEvaluation.strengths?.length > 0 || currentEvaluation.improvements?.length > 0) && <Collapsible open={showDetailedFeedback} onOpenChange={setShowDetailedFeedback}>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full mb-4 text-lg font-bold py-3 px-6 rounded-xl border-2 border-gray-300 shadow-[0px_4px_0px_0px] shadow-gray-300 hover:shadow-[0px_2px_0px_0px] hover:shadow-gray-300 active:shadow-[0px_0px_0px_0px] active:shadow-gray-300 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]">
                              {showDetailedFeedback ? <>
                                  Скрыть
                                  <ChevronUpIcon className="w-5 h-5 ml-2" />
                                </> : <>
                                  Подробнее
                                  <ChevronDownIcon className="w-5 h-5 ml-2" />
                                </>}
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="space-y-4">
                            {currentEvaluation.strengths?.length > 0 && <div className="bg-green-100 rounded-xl p-4 border-2 border-green-200">
                                <h5 className="text-lg font-bold text-green-700 mb-2 flex items-center">
                                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                                  Сильные стороны
                                </h5>
                                <ul className="list-disc list-inside text-base text-green-700 space-y-1">
                                  {currentEvaluation.strengths.map((strength, idx) => <li key={idx}>{strength}</li>)}
                                </ul>
                              </div>}
                            
                            {currentEvaluation.improvements?.length > 0 && <div className="bg-orange-100 rounded-xl p-4 border-2 border-orange-200">
                                <h5 className="text-lg font-bold text-orange-700 mb-2 flex items-center">
                                  <StarIcon className="w-5 h-5 mr-2" />
                                  Рекомендации
                                </h5>
                                <ul className="list-disc list-inside text-base text-orange-700 space-y-1">
                                  {currentEvaluation.improvements.map((improvement, idx) => <li key={idx}>{improvement}</li>)}
                                </ul>
                              </div>}
                          </CollapsibleContent>
                        </Collapsible>}
                    </div>
                  </div>}
              </div>)}

            {/* Loading indicator */}
            {isGenerating && <div className="mr-8">
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0px_4px_0px_0px] shadow-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{
                    animationDelay: '0.1s'
                  }}></div>
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{
                    animationDelay: '0.2s'
                  }}></div>
                    </div>
                  </div>
                </div>
              </div>}

            {/* Suggested Questions */}
            {!hasTask && data?.suggestedQuestions?.length > 0 && messages.length <= 1 && <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-[0px_4px_0px_0px] shadow-gray-200 p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Попробуйте спросить:</h4>
                <div className="space-y-3">
                  {data.suggestedQuestions.map((question, index) => <Button key={index} variant="outline" onClick={() => handleSuggestedQuestion(question)} disabled={isGenerating} className="w-full text-left text-base font-medium py-3 px-4 rounded-xl border-2 border-gray-300 shadow-[0px_4px_0px_0px] shadow-gray-300 hover:shadow-[0px_2px_0px_0px] hover:shadow-gray-300 active:shadow-[0px_0px_0px_0px] active:shadow-gray-300 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]">
                      {question}
                    </Button>)}
                </div>
              </div>}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex justify-center py-4 px-6 flex-shrink-0">
        <div className="w-full max-w-2xl space-y-4">
          {/* Input Form */}
          <div className="flex space-x-4">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder={hasTask && attemptsUsed >= maxAttempts ? "Попытки исчерпаны..." : "Введите ваш промпт..."} disabled={isGenerating || hasTask && attemptsUsed >= maxAttempts} className="flex-1 px-6 py-4 text-lg font-medium bg-white border-2 border-gray-300 rounded-2xl shadow-[0px_4px_0px_0px] shadow-gray-300 focus:outline-none focus:border-indigo-400 focus:shadow-indigo-300 focus:shadow-[0px_4px_0px_0px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400" />
            <Button onClick={() => handleSend()} disabled={!inputValue.trim() || isGenerating || hasTask && attemptsUsed >= maxAttempts} className="bg-indigo-500 h-full hover:bg-indigo-600 text-white px-6 py-4 text-lg font-bold rounded-2xl border-2 border-indigo-400 shadow-[0px_4px_0px_0px] shadow-indigo-400 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-400 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-400 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed min-w-[4rem]">
              {isGenerating ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <PaperAirplaneIcon className="w-6 h-6" />}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Try Again Button for Task Mode */}
            {hasTask && currentEvaluation && attemptsRemaining > 0 && !taskCompleted && <Button variant="outline" onClick={() => {
            setInputValue("");
            setCurrentEvaluation(null);
            setGeneratedContent("");
            setMessages([]);
            setShowDetailedFeedback(false);
          }} className="flex-1 text-lg font-bold py-4 px-6 rounded-xl border-2 border-gray-300 shadow-[0px_4px_0px_0px] shadow-gray-300 hover:shadow-[0px_2px_0px_0px] hover:shadow-gray-300 active:shadow-[0px_0px_0px_0px] active:shadow-gray-300 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Попробовать снова ({attemptsRemaining})
              </Button>}
            
            {/* Continue/Complete Button */}
            {(hasTask && currentEvaluation || !hasTask && canComplete) && <Button onClick={isLastBlock ? onComplete : onNext} disabled={!canComplete} className={`${hasTask && currentEvaluation && attemptsRemaining > 0 && !taskCompleted ? 'flex-1' : 'w-full'} bg-indigo-500 hover:bg-indigo-600 text-white px-12 py-4 text-lg font-bold rounded-xl border-none shadow-[0px_4px_0px_0px] shadow-indigo-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-600 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed`}>
                
                {isLastBlock ? 'Завершить урок' : 'Продолжить'}
              </Button>}

            {/* Progress indicator for non-task mode */}
            {!hasTask && !canComplete && <Button disabled className="w-full bg-gray-300 text-gray-600 px-12 py-4 text-lg font-bold rounded-xl border-none shadow-[0px_4px_0px_0px] shadow-gray-400 cursor-not-allowed">
                Еще раз
              </Button>}
          </div>
        </div>
      </div>
    </div>;
};