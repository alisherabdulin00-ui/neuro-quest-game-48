import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Eye, MessageSquare, Cpu, Zap, Trophy, Clock, Star } from "lucide-react";
import modulesImage from "@/assets/ai-modules.jpg";

const modules = [
  {
    id: 1,
    title: "Основы ИИ",
    description: "Узнай, что такое искусственный интеллект и как он работает",
    icon: Brain,
    progress: 85,
    lessons: 12,
    time: "2 часа",
    difficulty: "Новичок",
    color: "text-primary",
    bgColor: "bg-primary/10",
    points: 250,
    completed: true
  },
  {
    id: 2,
    title: "Машинное обучение",
    description: "Погрузись в мир алгоритмов машинного обучения",
    icon: Cpu,
    progress: 45,
    lessons: 18,
    time: "4 часа",
    difficulty: "Средний",
    color: "text-accent",
    bgColor: "bg-accent/10",
    points: 450,
    completed: false
  },
  {
    id: 3,
    title: "Компьютерное зрение",
    description: "Научи компьютер видеть и распознавать изображения",
    icon: Eye,
    progress: 0,
    lessons: 15,
    time: "3 часа",
    difficulty: "Продвинутый",
    color: "text-warning",
    bgColor: "bg-warning/10",
    points: 380,
    completed: false
  },
  {
    id: 4,
    title: "Обработка языка",
    description: "Создай чат-боты и системы понимания текста",
    icon: MessageSquare,
    progress: 20,
    lessons: 14,
    time: "3.5 часа",
    difficulty: "Продвинутый",
    color: "text-success",
    bgColor: "bg-success/10",
    points: 420,
    completed: false
  },
  {
    id: 5,
    title: "Нейронные сети",
    description: "Создавай и обучай собственные нейронные сети",
    icon: Zap,
    progress: 0,
    lessons: 20,
    time: "5 часов",
    difficulty: "Эксперт",
    color: "text-primary-glow",
    bgColor: "bg-primary-glow/10",
    points: 600,
    completed: false
  },
  {
    id: 6,
    title: "Проекты ИИ",
    description: "Создай реальные проекты с использованием ИИ",
    icon: Trophy,
    progress: 0,
    lessons: 10,
    time: "6 часов",
    difficulty: "Мастер",
    color: "text-accent",
    bgColor: "bg-accent/10",
    points: 800,
    completed: false
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Новичок": return "bg-success text-success-foreground";
    case "Средний": return "bg-warning text-warning-foreground";
    case "Продвинутый": return "bg-primary text-primary-foreground";
    case "Эксперт": return "bg-accent text-accent-foreground";
    case "Мастер": return "bg-destructive text-destructive-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const LearningModules = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20 mb-6">
            <Brain className="w-5 h-5 text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-muted-foreground">
              Учебные модули
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Твоё путешествие в мир ИИ
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Изучай искусственный интеллект пошагово через увлекательные интерактивные уроки, 
            практические задания и игровые челленджи
          </p>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card 
                key={module.id} 
                className="group hover:shadow-elevated transition-smooth hover:scale-105 border-border/50 backdrop-blur-sm bg-card/80"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-lg ${module.bgColor} group-hover:scale-110 transition-smooth`}>
                      <Icon className={`w-6 h-6 ${module.color}`} />
                    </div>
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {module.difficulty}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl group-hover:text-gradient transition-smooth">
                    {module.title}
                  </CardTitle>
                  
                  <CardDescription className="text-muted-foreground">
                    {module.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{module.lessons}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{module.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning" />
                      <span className="text-muted-foreground">{module.points}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <Button 
                    variant={module.completed ? "success" : module.progress > 0 ? "default" : "game"} 
                    className="w-full"
                  >
                    {module.completed ? (
                      <>
                        <Trophy className="w-4 h-4 mr-2" />
                        Пройдено
                      </>
                    ) : module.progress > 0 ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Продолжить
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Начать
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-secondary border-primary/20">
            <CardContent className="p-8">
              <div className="mb-6">
                <div 
                  className="w-20 h-20 mx-auto rounded-full bg-cover bg-center border-4 border-primary/20"
                  style={{ backgroundImage: `url(${modulesImage})` }}
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gradient">
                Готов стать экспертом по ИИ?
              </h3>
              <p className="text-muted-foreground mb-6">
                Присоединяйся к тысячам студентов, которые уже изучают будущее технологий
              </p>
              <Button variant="hero" size="lg">
                <Brain className="w-5 h-5 mr-2" />
                Начать бесплатно
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LearningModules;