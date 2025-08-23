import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Clock, BookOpen, CheckCircle, Play, Video, FileText, Presentation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { VideoContent } from "@/components/LessonContent/VideoContent";
import { SlidesContent } from "@/components/LessonContent/SlidesContent";
import { QuizContent } from "@/components/LessonContent/QuizContent";

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
}

interface LessonContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

const getLessonTypeColor = (type: string) => {
  switch (type) {
    case "video": return "bg-red-100 text-red-700";
    case "slides": return "bg-purple-100 text-purple-700";
    case "quiz": return "bg-green-100 text-green-700";
    case "reading": return "bg-blue-100 text-blue-700";
    default: return "bg-muted text-muted-foreground";
  }
};

const getLessonTypeName = (type: string) => {
  switch (type) {
    case "video": return "Видео";
    case "slides": return "Слайды";
    case "quiz": return "Тест";
    case "reading": return "Чтение";
    default: return type;
  }
};

const getLessonTypeIcon = (type: string) => {
  switch (type) {
    case "video": return Video;
    case "slides": return Presentation;
    case "quiz": return FileText;
    case "reading": return BookOpen;
    default: return BookOpen;
  }
};

const Lesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) return;

      try {
        // Fetch lesson details
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        setLesson(lessonData);

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', lessonData.course_id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch lesson content
        const { data: contentData, error: contentError } = await supabase
          .from('lesson_content')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('order_index');

        if (contentError) throw contentError;
        setLessonContent(contentData || []);
      } catch (error) {
        console.error('Error fetching lesson data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId]);

  const currentContent = lessonContent[currentContentIndex];
  const progress = lessonContent.length > 0 ? ((currentContentIndex + 1) / lessonContent.length) * 100 : 0;

  const handleNext = () => {
    if (currentContentIndex < lessonContent.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  const handleComplete = () => {
    // В будущем здесь можно добавить логику сохранения прогресса
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Загружаем урок...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Урок не найден</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLastContent = currentContentIndex === lessonContent.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к обучению
          </Button>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{lesson.title}</h1>
              <Badge className={getLessonTypeColor(lesson.lesson_type)}>
                {getLessonTypeName(lesson.lesson_type)}
              </Badge>
            </div>
            
            <p className="text-lg text-muted-foreground mb-4">
              {lesson.description}
            </p>
            
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>Курс: {course.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{lesson.duration_minutes} минут</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Прогресс урока</span>
                <span className="text-sm text-muted-foreground">
                  {currentContentIndex + 1} из {lessonContent.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="mb-8">
          {lesson.lesson_type === 'video' && lessonContent.length > 0 && (
            <VideoContent 
              videoUrl={lessonContent[0].content}
              title={lessonContent[0].title}
            />
          )}

          {lesson.lesson_type === 'slides' && (
            <SlidesContent slides={lessonContent} />
          )}

          {lesson.lesson_type === 'quiz' && (
            <QuizContent questions={lessonContent} />
          )}

          {lesson.lesson_type === 'reading' && currentContent && (
            <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5" />
                  {currentContent.title}
                  <Badge className={getLessonTypeColor(lesson.lesson_type)}>
                    {getLessonTypeName(lesson.lesson_type)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {currentContent.content}
                </div>
              </CardContent>
            </Card>
          )}

          {!currentContent && lessonContent.length === 0 && (
            <Card className="mb-8">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-4">Контент урока пуст</h3>
                <p className="text-muted-foreground">
                  Этот урок еще не заполнен контентом.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation - only show for reading lessons */}
        {lesson.lesson_type === 'reading' && lessonContent.length > 1 && (
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentContentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Слайд {currentContentIndex + 1} из {lessonContent.length}
              </p>
            </div>

            {isLastContent ? (
              <Button onClick={handleComplete}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Завершить урок
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Далее
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Complete button for video, slides and quiz lessons */}
        {(lesson.lesson_type === 'video' || lesson.lesson_type === 'slides' || lesson.lesson_type === 'quiz') && (
          <div className="text-center">
            <Button onClick={handleComplete} size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Завершить урок
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Lesson;