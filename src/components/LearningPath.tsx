import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, BookOpen, FileText, Video, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  lesson_type: string;
  order_index: number;
  duration_minutes: number;
}

interface UserProgress {
  lesson_id: string;
  progress_percentage: number;
  completed: boolean;
  completed_at: string | null;
}

interface LearningPathProps {
  courseId: string;
}

const LearningPath = ({ courseId }: LearningPathProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('LearningPath render:', { courseId, user: user?.id, userProgress: userProgress.length });

  useEffect(() => {
    checkUser();
  }, [courseId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await Promise.all([
        fetchLessons(),
        fetchUserProgress(session.user.id)
      ]);
    } else {
      await fetchLessons();
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (userId: string) => {
    try {
      console.log('Fetching progress for user:', userId);
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, progress_percentage, completed, completed_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user progress:', error);
        return;
      }

      console.log('Progress data fetched:', data);
      setUserProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const updateLessonProgress = async (lessonId: string, completed: boolean = true) => {
    console.log('updateLessonProgress called with:', { lessonId, completed, user: user?.id });
    
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для сохранения прогресса",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Calling edge function with:', { lessonId, progressPercentage: 100, completed });
      
      const { data, error } = await supabase.functions.invoke('update-lesson-progress', {
        body: {
          lessonId,
          progressPercentage: 100,
          completed
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error updating progress:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить прогресс",
          variant: "destructive"
        });
        return;
      }

      // Refresh user progress
      console.log('Refreshing user progress for user:', user.id);
      await fetchUserProgress(user.id);

      toast({
        title: completed ? "Урок завершен!" : "Прогресс сохранен",
        description: completed ? "Урок отмечен как завершенный" : "Ваш прогресс сохранен",
      });

    } catch (error) {
      console.error('Error updating lesson progress:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive"
      });
    }
  };

  const getLessonProgress = (lessonId: string) => {
    const progress = userProgress.find(p => p.lesson_id === lessonId);
    console.log(`Progress for lesson ${lessonId}:`, progress);
    return progress;
  };

  const isLessonCompleted = (lessonId: string) => {
    const progress = getLessonProgress(lessonId);
    const completed = progress?.completed || false;
    console.log(`Lesson ${lessonId} completed:`, completed);
    return completed;
  };

  const isLessonUnlocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return true; // First lesson is always unlocked
    const previousLesson = lessons[lessonIndex - 1];
    const unlocked = previousLesson ? isLessonCompleted(previousLesson.id) : false;
    console.log(`Lesson at index ${lessonIndex} unlocked:`, unlocked);
    return unlocked;
  };

  const getLessonIcon = (type: string, index: number) => {
    if (index === 0) return Play;
    
    switch (type) {
      case 'video': return Video;
      case 'reading': return BookOpen;
      case 'quiz': return FileText;
      default: return BookOpen;
    }
  };

  const handleLessonClick = (lesson: Lesson, unlocked: boolean, isCompleted: boolean) => {
    if (unlocked) {
      if (!isCompleted && user) {
        // If lesson is not completed and user is logged in, mark as complete
        updateLessonProgress(lesson.id);
      } else {
        // Otherwise navigate to lesson
        navigate(`/lesson/${lesson.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 bg-background">
      {/* Mobile-first vertical learning path */}
      <div className="max-w-md mx-auto">
        {/* Connection lines */}
        <div className="relative">
          {lessons.map((_, index) => {
            if (index === lessons.length - 1) return null;
            
            return (
              <div
                key={`connection-${index}`}
                className="absolute left-1/2 transform -translate-x-1/2 z-0"
                style={{
                  top: `${(index + 1) * 140 - 20}px`,
                  height: '60px'
                }}
              >
                <div className="w-0.5 h-full bg-primary/30 relative">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-primary/30"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lesson nodes */}
        <div className="space-y-8">
          {lessons.map((lesson, index) => {
            const Icon = getLessonIcon(lesson.lesson_type, index);
            const isCompleted = isLessonCompleted(lesson.id);
            const unlocked = isLessonUnlocked(index);
            
            console.log(`Lesson ${lesson.title}:`, { id: lesson.id, isCompleted, unlocked, index });
            
            return (
              <div
                key={lesson.id}
                className="relative flex flex-col items-center"
                style={{ minHeight: '140px' }}
              >
                {/* Lesson node */}
                <div 
                  className={`relative flex flex-col items-center group z-10 ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => handleLessonClick(lesson, unlocked, isCompleted)}
                >
                  {/* 3D lesson button */}
                  <div className={`
                    relative w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-200
                    ${unlocked ? 'group-hover:scale-105 group-active:scale-95' : ''}
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground border-[3px] border-primary/80 shadow-[0px_4px_0px_0px] shadow-primary/80' 
                      : unlocked
                      ? 'bg-primary text-primary-foreground border-[3px] border-primary/80 shadow-[0px_4px_0px_0px] shadow-primary/80'
                      : 'bg-muted text-muted-foreground opacity-60 border-[3px] border-muted shadow-[0px_4px_0px_0px] shadow-muted'
                    }
                  `}>
                    
                    {/* Icon */}
                    <div className="relative z-20">
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7" />
                      ) : unlocked ? (
                        <Icon className="w-7 h-7" />
                      ) : (
                        <Lock className="w-7 h-7" />
                      )}
                    </div>
                  </div>
                  
                  {/* Lesson info */}
                  <div className="mt-3 text-center">
                    <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border max-w-[280px]">
                      <p className="text-sm font-semibold text-card-foreground leading-tight">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lesson.duration_minutes} мин
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  {isCompleted && (
                    <div className="mt-2">
                      <div className="bg-success/10 text-success text-xs px-2 py-1 rounded-full font-medium shadow-sm border border-success/20">
                        ✓ Завершено
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Course completion celebration */}
        {lessons.length > 0 && (
          <div className="flex flex-col items-center mt-12 pb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40">
              <span className="text-3xl">🏆</span>
            </div>
            <div className="mt-4 text-center">
              <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-3 shadow-lg">
                <p className="text-base font-bold text-warning-foreground">Поздравляем!</p>
                <p className="text-sm text-muted-foreground">Курс завершен</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPath;