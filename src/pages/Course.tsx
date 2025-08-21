import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, BookOpen, Play, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";

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
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Начинающий": return "bg-success text-success-foreground";
    case "Средний": return "bg-warning text-warning-foreground";
    case "Продвинутый": return "bg-primary text-primary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getLessonTypeColor = (type: string) => {
  switch (type) {
    case "theory": return "bg-blue-100 text-blue-700";
    case "practice": return "bg-green-100 text-green-700";
    case "mixed": return "bg-purple-100 text-purple-700";
    default: return "bg-muted text-muted-foreground";
  }
};

const getLessonTypeName = (type: string) => {
  switch (type) {
    case "theory": return "Теория";
    case "practice": return "Практика";
    case "mixed": return "Смешанный";
    default: return type;
  }
};

const Course = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index');

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Загружаем курс...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Курс не найден</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к курсам
          </Button>

          <div className="flex items-start gap-6">
            <div className="text-6xl">{course.icon}</div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{course.title}</h1>
                <Badge className={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
              </div>
              
              <p className="text-xl text-muted-foreground mb-4">
                {course.description}
              </p>
              
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.lessons_count} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration_hours} часов</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Прогресс курса</h2>
              <span className="text-lg font-medium">0%</span>
            </div>
            <Progress value={0} className="h-3" />
            <p className="text-muted-foreground mt-2">
              Пройдено 0 из {lessons.length} уроков
            </p>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Уроки курса</h2>
          
          {lessons.map((lesson, index) => (
            <Card 
              key={lesson.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleLessonClick(lesson.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{lesson.title}</h3>
                      <Badge className={getLessonTypeColor(lesson.lesson_type)}>
                        {getLessonTypeName(lesson.lesson_type)}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-2">
                      {lesson.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration_minutes} мин</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Course Actions */}
        <div className="mt-12 text-center">
          <Button size="lg" className="px-8">
            <Play className="w-5 h-5 mr-2" />
            Начать первый урок
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Course;