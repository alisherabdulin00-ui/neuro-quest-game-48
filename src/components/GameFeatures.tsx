import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Trophy, Target, Users, Zap, Gift } from "lucide-react";

const features = [
  {
    icon: Gamepad2,
    title: "Интерактивные симуляции",
    description: "Управляй виртуальными нейронными сетями и смотри, как они обучаются в реальном времени",
    badge: "Популярно",
    badgeColor: "bg-primary text-primary-foreground"
  },
  {
    icon: Trophy,
    title: "Система достижений",
    description: "Собирай награды, открывай новые уровни и соревнуйся с друзьями в рейтинге",
    badge: "Новое",
    badgeColor: "bg-accent text-accent-foreground"
  },
  {
    icon: Target,
    title: "Практические задачи",
    description: "Решай реальные задачи ИИ: от распознавания изображений до создания чат-ботов",
    badge: "Эксклюзив",
    badgeColor: "bg-success text-success-foreground"
  },
  {
    icon: Users,
    title: "Командные проекты",
    description: "Работай в команде над большими проектами ИИ и учись у других студентов",
    badge: "Бета",
    badgeColor: "bg-warning text-warning-foreground"
  },
  {
    icon: Zap,
    title: "Мгновенная обратная связь",
    description: "Получай немедленные результаты своих экспериментов и корректируй подход",
    badge: "Pro",
    badgeColor: "bg-primary text-primary-foreground"
  },
  {
    icon: Gift,
    title: "Ежедневные челленджи",
    description: "Новые задачи каждый день для поддержания мотивации и прогресса в обучении",
    badge: "Ежедневно",
    badgeColor: "bg-accent text-accent-foreground"
  }
];

const GameFeatures = () => {
  return (
    <section className="py-20 px-6 bg-gradient-secondary">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20 mb-6">
            <Gamepad2 className="w-5 h-5 text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-muted-foreground">
              Игровые функции
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Обучение как игра
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Превращаем сложные концепции ИИ в увлекательные игровые механики, 
            которые делают обучение эффективным и запоминающимся
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-elevated transition-smooth hover:scale-105 border-border/50 backdrop-blur-sm bg-card/80 animate-float"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gradient-primary group-hover:scale-110 transition-smooth">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <Badge className={feature.badgeColor}>
                      {feature.badge}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl group-hover:text-gradient transition-smooth">
                    {feature.title}
                  </CardTitle>
                  
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="h-1 bg-gradient-primary rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom highlight */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-gradient-primary/10 backdrop-blur-sm px-8 py-4 rounded-full border border-primary/20">
            <Trophy className="w-6 h-6 text-primary animate-glow" />
            <span className="text-lg font-medium">
              Более <span className="text-gradient font-bold">10,000</span> игроков уже в игре!
            </span>
            <Zap className="w-6 h-6 text-accent animate-pulse-glow" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameFeatures;