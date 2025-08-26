import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Eye, MessageSquare, Cpu, Zap, Trophy, Clock, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import modulesImage from "@/assets/ai-modules.jpg";

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  duration_hours: number;
  lessons_count: number;
  color: string;
  bg_color: string;
  order_index: number;
  badges: string[];
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Начинающий": return "bg-success text-success-foreground";
    case "Средний": return "bg-warning text-warning-foreground";
    case "Продвинутый": return "bg-primary text-primary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getIconFromString = (iconStr: string) => {
  switch (iconStr) {
    case "🧠": return Brain;
    case "💬": return MessageSquare;
    case "🎨": return Eye;
    case "🎬": return Zap;
    case "⚙️": return Cpu;
    default: return Brain;
  }
};

const LearningModules = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at');

        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (courseId: string) => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Загружаем курсы...</p>
          </div>
        </div>
      </section>
    );
  }

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

        {/* Courses grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const Icon = getIconFromString(course.icon);
            return (
              <Card 
                key={course.id} 
                className="group hover:shadow-elevated transition-smooth hover:scale-105 border-border/50 backdrop-blur-sm bg-card/80 cursor-pointer"
                onClick={() => handleCourseClick(course.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-lg ${course.bg_color} group-hover:scale-110 transition-smooth`}>
                      <Icon className={`w-6 h-6 ${course.color}`} />
                    </div>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl group-hover:text-gradient transition-smooth">
                    {course.title}
                  </CardTitle>
                  
                  <CardDescription className="text-muted-foreground">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{course.lessons_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{course.duration_hours}ч</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <Button 
                    variant="game" 
                    className="w-full"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Начать
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