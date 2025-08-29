import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CpuChipIcon, PaperAirplaneIcon, ArrowPathIcon, Cog6ToothIcon, DocumentTextIcon, PhotoIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { useState, useRef, useEffect } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import ReactMarkdown from 'react-markdown';
import UserCoinsDisplay from "@/components/UserCoinsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AITools = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5-2025-08-07");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState("text");
  const [userId, setUserId] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState<number>(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const modelsByType = {
    text: [
      { value: "gpt-5-2025-08-07", label: "GPT-5", provider: "OpenAI" },
      { value: "gpt-5-mini-2025-08-07", label: "GPT-5 Mini", provider: "OpenAI" },
      { value: "gpt-5-nano-2025-08-07", label: "GPT-5 Nano", provider: "OpenAI" },
      { value: "gpt-4.1-2025-04-14", label: "GPT-4.1", provider: "OpenAI" },
      { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
      { value: "o3-2025-04-16", label: "O3", provider: "OpenAI" },
      { value: "o4-mini-2025-04-16", label: "O4 Mini", provider: "OpenAI" },
      { value: "claude-opus-4-20250514", label: "Claude 4 Opus", provider: "Anthropic" },
      { value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet", provider: "Anthropic" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "Anthropic" }
    ],
    image: [
      { value: "gpt-image-1", label: "GPT Image 1", provider: "OpenAI" },
      { value: "dall-e-3", label: "DALL-E 3", provider: "OpenAI" },
      { value: "dall-e-2", label: "DALL-E 2", provider: "OpenAI" }
    ],
    video: [
      { value: "sora-1", label: "Sora", provider: "OpenAI" },
      { value: "runway-gen3", label: "Gen-3", provider: "Runway" }
    ]
  };

  const getCurrentModels = () => modelsByType[selectedTab as keyof typeof modelsByType] || modelsByType.text;

  // Auto-select first model when switching tabs
  useEffect(() => {
    const currentModels = getCurrentModels();
    if (!currentModels.some(m => m.value === selectedModel)) {
      setSelectedModel(currentModels[0]?.value || "gpt-5-2025-08-07");
    }
  }, [selectedTab]);

  const scrollToBottom = () => {
    scrollAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return;

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
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: { 
          prompt: inputValue,
          model: selectedModel
        },
        headers: {
          authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        let errorMsg = `Ошибка: ${error.message}`;
        
        // Handle insufficient coins error
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
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Show coins deducted notification
        if (data.coinsDeducted > 0) {
          toast({
            title: `Списано ${data.coinsDeducted} монет`,
            description: `Остаток: ${data.remainingCoins} монет`,
          });
        }

        // Refresh coin display
        if ((window as any).refreshUserCoins) {
          (window as any).refreshUserCoins();
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">AI Tools</h1>
            {userId && (
              <div className="ml-4">
                <UserCoinsDisplay userId={userId} onCoinsUpdate={setUserCoins} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-28 h-8 text-xs border-0 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-80">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-2">
                    <TabsTrigger value="text" className="flex items-center gap-1 text-xs">
                      <DocumentTextIcon className="w-3 h-3" />
                      Текст
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-1 text-xs">
                      <PhotoIcon className="w-3 h-3" />
                      Картинка
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1 text-xs">
                      <VideoCameraIcon className="w-3 h-3" />
                      Видео
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="mt-2">
                    <div className="space-y-1">
                      {modelsByType.text.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-xs">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.provider}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="image" className="mt-2">
                    <div className="space-y-1">
                      {modelsByType.image.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-xs">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.provider}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="video" className="mt-2">
                    <div className="space-y-1">
                      {modelsByType.video.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-xs">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.provider}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Cog6ToothIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <CpuChipIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Как дела?</h2>
                  <p className="text-muted-foreground text-sm">Задайте любой вопрос, чтобы начать</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <CpuChipIcon className="w-3.5 h-3.5 text-primary-foreground" />
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

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4 pb-24">
        <div className="relative">
          <div className="relative flex items-center bg-muted/50 border border-border rounded-3xl shadow-sm hover:shadow-md transition-all">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              disabled={isGenerating}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-12 py-3 text-base placeholder:text-muted-foreground/60 min-h-[48px]"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              size="icon"
              variant="ghost"
              className="absolute right-2 h-8 w-8 rounded-full hover:bg-muted disabled:opacity-50"
            >
              {isGenerating ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center mt-2 px-2">
            AI может допускать ошибки. Проверяйте важную информацию.
          </p>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default AITools;