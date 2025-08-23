import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, MessageSquare, FileText, Image, Code } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";

const AITools = () => {
  const aiTools = [
    {
      id: "chat-assistant",
      name: "ИИ-Ассистент",
      description: "Персональный помощник для ответов на вопросы по обучению",
      icon: MessageSquare,
      color: "bg-blue-500",
      status: "Доступно",
      features: ["Ответы на вопросы", "Объяснения концепций", "Помощь с заданиями"]
    },
    {
      id: "code-generator",
      name: "Генератор кода",
      description: "Создание и объяснение кода на разных языках программирования",
      icon: Code,
      color: "bg-green-500",
      status: "Доступно",
      features: ["Генерация кода", "Отладка", "Объяснения алгоритмов"]
    },
    {
      id: "text-analyzer",
      name: "Анализатор текста",
      description: "Анализ и улучшение текстов, проверка грамматики",
      icon: FileText,
      color: "bg-purple-500",
      status: "Скоро",
      features: ["Проверка грамматики", "Стилистический анализ", "Рерайтинг"]
    },
    {
      id: "image-generator",
      name: "Генератор изображений",
      description: "Создание изображений и диаграмм для обучения",
      icon: Image,
      color: "bg-orange-500",
      status: "Скоро",
      features: ["Создание диаграмм", "Иллюстрации", "Инфографика"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ИИ-инструменты</h1>
              <p className="text-sm text-muted-foreground">Умные помощники для обучения</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-6">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            const isAvailable = tool.status === "Доступно";
            
            return (
              <Card key={tool.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${tool.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{tool.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {tool.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={isAvailable ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {tool.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Возможности:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {tool.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={!isAvailable}
                      variant={isAvailable ? "default" : "secondary"}
                    >
                      {isAvailable ? "Использовать" : "Скоро доступно"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5" />
                Больше инструментов скоро
              </CardTitle>
              <CardDescription>
                Мы постоянно работаем над добавлением новых ИИ-инструментов для улучшения вашего обучения
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AITools;