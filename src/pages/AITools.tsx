import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CpuChipIcon, PaperAirplaneIcon, ArrowPathIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import { useState, useRef, useEffect } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import ReactMarkdown from 'react-markdown';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openAIModels = [
    { value: "gpt-5-2025-08-07", label: "GPT-5" },
    { value: "gpt-5-mini-2025-08-07", label: "GPT-5 Mini" },
    { value: "gpt-5-nano-2025-08-07", label: "GPT-5 Nano" },
    { value: "gpt-4.1-2025-04-14", label: "GPT-4.1" },
    { value: "o3-2025-04-16", label: "O3" },
    { value: "o4-mini-2025-04-16", label: "O4 Mini" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);
    
    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + "_loading",
      type: 'assistant',
      content: "Генерирую ответ...",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      const result = await fetch(`https://pvbjsztremgynwsjokge.supabase.co/functions/v1/generate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          model: selectedModel
        })
      });
      
      if (!result.ok) {
        const errorData = await result.text();
        throw new Error(`Ошибка при генерации текста: ${errorData}`);
      }
      
      const data = await result.json();
      
      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: data.response, id: Date.now().toString() }
          : msg
      ));
    } catch (error) {
      console.error('Error generating text:', error);
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: 'Произошла ошибка при генерации текста. Попробуйте еще раз.', id: Date.now().toString() }
          : msg
      ));
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
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded-md">
              <CpuChipIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-semibold">ChatGPT</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {openAIModels.map((model) => (
                  <SelectItem key={model.value} value={model.value} className="text-xs">
                    {model.label}
                  </SelectItem>
                ))}
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
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <CpuChipIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Как дела?</h2>
                  <p className="text-muted-foreground">Задайте любой вопрос, чтобы начать</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    <div className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : ''}`}>
                      {message.type === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <CpuChipIcon className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`flex-1 ${message.type === 'user' ? 'max-w-xs' : 'max-w-none'}`}>
                        <div className={`rounded-lg p-3 ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted'
                        }`}>
                          {message.type === 'assistant' ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                      </div>
                      {message.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">Вы</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              disabled={isGenerating}
              className="pr-12 min-h-[44px] py-3"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {isGenerating ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default AITools;