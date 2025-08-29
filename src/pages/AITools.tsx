import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Bot, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";

const AITools = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5-2025-08-07");
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState("");

  const openAIModels = [
    { value: "gpt-5-2025-08-07", label: "GPT-5 (флагманская модель)" },
    { value: "gpt-5-mini-2025-08-07", label: "GPT-5 Mini (быстрая)" },
    { value: "gpt-5-nano-2025-08-07", label: "GPT-5 Nano (очень быстрая)" },
    { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (надежная)" },
    { value: "o3-2025-04-16", label: "O3 (для сложных задач)" },
    { value: "o4-mini-2025-04-16", label: "O4 Mini (быстрое мышление)" }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setResponse("");
    
    try {
      const result = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel
        })
      });
      
      if (!result.ok) {
        throw new Error('Ошибка при генерации текста');
      }
      
      const data = await result.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error generating text:', error);
      setResponse('Произошла ошибка при генерации текста. Попробуйте еще раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ИИ-боты</h1>
              <p className="text-sm text-muted-foreground">Генерация текста с помощью ИИ</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Text Generation Bot */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Текстовый ИИ-бот</CardTitle>
                <CardDescription className="mt-1">
                  Генерация текста с помощью передовых языковых моделей OpenAI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model-select">Выберите модель</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Выберите модель ИИ" />
                </SelectTrigger>
                <SelectContent>
                  {openAIModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Ваш запрос</Label>
              <Textarea
                id="prompt"
                placeholder="Опишите, что вы хотите, чтобы ИИ сгенерировал..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Генерирую...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Генерировать
                </>
              )}
            </Button>

            {/* Response */}
            {response && (
              <div className="space-y-2">
                <Label>Ответ ИИ</Label>
                <div className="p-4 bg-muted rounded-lg border">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {response}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AITools;