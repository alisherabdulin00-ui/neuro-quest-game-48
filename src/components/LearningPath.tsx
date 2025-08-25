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

  // Calculate smooth curved path position for each lesson
  const calculateCurvePosition = (index: number) => {
    const amplitude = 120; // How far lessons swing left/right (increased)
    const verticalSpacing = 140; // Vertical distance between lessons (reduced for smoother flow)
    const frequency = 0.8; // Controls the curve frequency
    
    // Use sinusoidal function for smooth curve
    const x = amplitude * Math.sin(index * frequency);
    const y = index * verticalSpacing;
    
    // Add subtle randomization for organic feel
    const organicVariation = Math.sin(index * 1.3) * 15;
    
    return { 
      x: x + organicVariation, 
      y: y 
    };
  };

  return (
    <div className="relative px-4 py-8 overflow-hidden">
      {/* Curved learning path container */}
      <div className="relative w-full max-w-md mx-auto min-h-screen">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i * 120)}px`
              }}
            />
          ))}
        </div>

        {/* Optional subtle background path */}
        <svg 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-20"
          width="400" 
          height={`${lessons.length * 140 + 200}`}
          style={{ zIndex: 0 }}
        >
          <defs>
            <pattern id="dashed-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <circle cx="4" cy="4" r="1" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <path
            d={lessons.map((_, index) => {
              const pos = calculateCurvePosition(index);
              return index === 0 
                ? `M ${200 + pos.x} ${80 + pos.y}`
                : `L ${200 + pos.x} ${80 + pos.y}`;
            }).join(' ')}
            stroke="url(#dashed-pattern)"
            strokeWidth="2"
            fill="none"
            className="text-primary/30"
          />
        </svg>

        {/* Lesson nodes with curved positioning */}
        {lessons.map((lesson, index) => {
          const Icon = getLessonIcon(lesson.lesson_type, index);
          const isCompleted = isLessonCompleted(lesson.id);
          const unlocked = isLessonUnlocked(index);
          const position = calculateCurvePosition(index);
          
          console.log(`Lesson ${lesson.title}:`, { id: lesson.id, isCompleted, unlocked, index });
          
          return (
            <div
              key={lesson.id}
              className="absolute"
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `${80 + position.y}px`,
                transform: 'translateX(-50%)'
              }}
            >
              
              {/* Lesson node container */}
              <div 
                className={`relative flex flex-col items-center group ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => handleLessonClick(lesson.id, unlocked)}
              >
                {/* Enhanced 3D lesson orb */}
                <div className={`
                  relative w-20 h-20 rounded-full flex items-center justify-center 
                  ${isCompleted 
                    ? 'bg-emerald-500 text-white shadow-[0_6px_0_#059669]' 
                    : unlocked
                    ? 'bg-primary text-white shadow-[0_6px_0_hsl(var(--primary)/0.8)]'
                    : 'bg-slate-400 text-gray-200 shadow-[0_6px_0_#475569] opacity-60'
                  }
                `}>
                  
                  {/* Icon */}
                  <div className="relative z-20">
                    {isCompleted ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : unlocked ? (
                      <Icon className="w-8 h-8" />
                    ) : (
                      <Lock className="w-8 h-8" />
                    )}
                  </div>
                </div>
                
                {/* Floating complete button */}
                {unlocked && !isCompleted && user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Button clicked for lesson:', lesson.id);
                      updateLessonProgress(lesson.id);
                    }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 rounded-full flex items-center justify-center text-white text-xs z-30 shadow-lg border-2 border-white/50"
                    title="Отметить как завершенный"
                  >
                    ✓
                  </button>
                )}
                
                {/* Lesson info card */}
                <div className="mt-4 text-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20">
                    <p className="text-xs font-bold text-gray-800 mb-1 leading-tight">
                      {lesson.title}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <span>⏱️</span>
                      {lesson.duration_minutes} мин
                    </p>
                  </div>
                </div>
                
                {/* Progress indicator for completed lessons */}
                {isCompleted && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                      Завершено! 🎉
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* End celebration */}
        {lessons.length > 0 && (
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: '50%',
              top: `${80 + lessons.length * 140 + 80}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="mt-3 text-center">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 shadow-lg">
                <p className="text-sm font-bold text-yellow-800">Поздравляем!</p>
                <p className="text-xs text-yellow-700">Курс завершен</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPath;