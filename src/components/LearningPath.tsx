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
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, progress_percentage, completed, completed_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user progress:', error);
        return;
      }

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
    return userProgress.find(p => p.lesson_id === lessonId);
  };

  const isLessonCompleted = (lessonId: string) => {
    const progress = getLessonProgress(lessonId);
    return progress?.completed || false;
  };

  const isLessonUnlocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return true; // First lesson is always unlocked
    const previousLesson = lessons[lessonIndex - 1];
    return previousLesson ? isLessonCompleted(previousLesson.id) : false;
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

  const handleLessonClick = (lessonId: string, unlocked: boolean) => {
    if (unlocked) {
      navigate(`/lesson/${lessonId}`);
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
    <div className="relative px-4 py-6">
      {/* Learning path with connecting lines */}
      <div className="relative max-w-xs mx-auto">
        {lessons.map((lesson, index) => {
          const Icon = getLessonIcon(lesson.lesson_type, index);
          const isCompleted = isLessonCompleted(lesson.id);
          const unlocked = isLessonUnlocked(index);
          
          console.log(`Lesson ${lesson.title}:`, { id: lesson.id, isCompleted, unlocked, index });
          
          return (
            <div key={lesson.id} className="relative mb-16 last:mb-0">
              {/* Vertical connecting line */}
              {index < lessons.length - 1 && (
                <div className={`absolute left-1/2 top-24 transform -translate-x-0.5 w-1 h-12 rounded-full ${
                  isCompleted ? 'bg-gradient-to-b from-green-400 to-green-500' : 'bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/10'
                }`} />
              )}
              
              {/* Lesson item - centered */}
              <div 
                className={`flex flex-col items-center group ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => handleLessonClick(lesson.id, unlocked)}
              >
                {/* Lesson box with 3D effect */}
                <div className={`
                  relative w-24 h-24 rounded-full flex items-center justify-center 
                  transition-all duration-300 transform
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' 
                    : unlocked
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:-translate-y-1'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500 text-gray-300 shadow-lg shadow-gray-400/20 opacity-50'
                  }
                  border-4 border-white/20
                  before:absolute before:inset-0 before:rounded-full 
                  before:bg-gradient-to-t before:from-black/10 before:to-white/20
                  before:opacity-50
                `}>
                  {/* Inner glow effect */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-t from-transparent to-white/30 opacity-60"></div>
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    {isCompleted ? (
                      <CheckCircle2 className="w-10 h-10 drop-shadow-sm" />
                    ) : unlocked ? (
                      <Icon className="w-10 h-10 drop-shadow-sm" />
                    ) : (
                      <Lock className="w-10 h-10 drop-shadow-sm" />
                    )}
                  </div>
                  
                  {/* Bottom shadow for 3D effect */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-3 bg-black/20 rounded-full blur-sm"></div>
                </div>
                
                {/* Complete Button for unlocked lessons */}
                {unlocked && !isCompleted && user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLessonProgress(lesson.id);
                    }}
                    className="absolute top-0 right-4 w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-sm transition-colors z-20 shadow-lg"
                    title="Отметить как завершенный"
                  >
                    ✓
                  </button>
                )}
                
                {/* Lesson title and duration */}
                <div className="mt-6 text-center max-w-[120px]">
                  <p className="text-sm font-semibold text-foreground mb-1 leading-tight">
                    {lesson.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lesson.duration_minutes} мин
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPath;