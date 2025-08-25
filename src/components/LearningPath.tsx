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

  // Calculate curved path position for each lesson
  const calculateCurvePosition = (index: number, total: number) => {
    // Create alternating positions for the snake-like path
    const amplitude = 120; // How far lessons swing left/right
    const verticalSpacing = 180; // Vertical distance between lessons
    
    // Create S-curve using sine wave
    const normalizedIndex = index / Math.max(1, total - 1);
    const x = Math.sin(normalizedIndex * Math.PI * 2) * amplitude;
    const y = index * verticalSpacing;
    
    return { x, y };
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
              className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i * 120)}px`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i * 0.5)}s`
              }}
            />
          ))}
        </div>

        {/* Lesson nodes with curved positioning */}
        {lessons.map((lesson, index) => {
          const Icon = getLessonIcon(lesson.lesson_type, index);
          const isCompleted = isLessonCompleted(lesson.id);
          const unlocked = isLessonUnlocked(index);
          const position = calculateCurvePosition(index, lessons.length);
          
          console.log(`Lesson ${lesson.title}:`, { id: lesson.id, isCompleted, unlocked, index });
          
          return (
            <div
              key={lesson.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `${position.y}px`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Curved connecting path */}
              {index < lessons.length - 1 && (
                <>
                  {/* Main path line */}
                  <svg
                    className="absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-none"
                    width="300"
                    height="200"
                    viewBox="0 0 300 200"
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      <linearGradient id={`pathGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isCompleted ? "#10b981" : "#e2e8f0"} />
                        <stop offset="100%" stopColor={isCompleted ? "#059669" : "#cbd5e1"} />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 150 0 Q ${150 + (position.x > 0 ? 80 : -80)} 100 ${150 + (calculateCurvePosition(index + 1, lessons.length).x - position.x)} 180`}
                      stroke={`url(#pathGradient-${index})`}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className={isCompleted ? "drop-shadow-sm" : ""}
                    />
                  </svg>
                  
                  {/* Progress dots along path */}
                  {isCompleted && (
                    <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
                      {[...Array(3)].map((_, dotIndex) => (
                        <div
                          key={dotIndex}
                          className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"
                          style={{
                            left: `${dotIndex * 15}px`,
                            top: `${dotIndex * 25}px`,
                            animationDelay: `${dotIndex * 0.3}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {/* Lesson node container */}
              <div 
                className={`relative flex flex-col items-center group ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => handleLessonClick(lesson.id, unlocked)}
              >
                {/* Enhanced 3D lesson orb */}
                <div className={`
                  relative w-20 h-20 rounded-full flex items-center justify-center 
                  transition-all duration-500 transform-gpu
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40 animate-bounce-subtle' 
                    : unlocked
                    ? 'bg-gradient-to-br from-blue-400 via-primary to-blue-600 text-white shadow-2xl shadow-primary/40 hover:scale-110 hover:-translate-y-2 hover:rotate-3'
                    : 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 text-gray-200 shadow-xl shadow-gray-400/30 opacity-60'
                  }
                  border-4 border-white/30
                  before:absolute before:inset-0 before:rounded-full 
                  before:bg-gradient-to-t before:from-black/20 before:via-transparent before:to-white/40
                  after:absolute after:inset-2 after:rounded-full 
                  after:bg-gradient-to-br after:from-white/30 after:to-transparent
                `}>
                  
                  {/* Glowing ring effect for active lessons */}
                  {unlocked && !isCompleted && (
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 animate-spin-slow opacity-75"></div>
                  )}
                  
                  {/* Inner highlight */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/10 opacity-80"></div>
                  
                  {/* Icon with enhanced styling */}
                  <div className="relative z-20 transform transition-transform duration-300 group-hover:scale-110">
                    {isCompleted ? (
                      <CheckCircle2 className="w-8 h-8 drop-shadow-lg filter brightness-110" />
                    ) : unlocked ? (
                      <Icon className="w-8 h-8 drop-shadow-lg filter brightness-110" />
                    ) : (
                      <Lock className="w-8 h-8 drop-shadow-lg" />
                    )}
                  </div>
                  
                  {/* Enhanced 3D shadow */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-md"></div>
                  
                  {/* Completion sparkle effect */}
                  {isCompleted && (
                    <div className="absolute inset-0 rounded-full">
                      {[...Array(4)].map((_, sparkleIndex) => (
                        <div
                          key={sparkleIndex}
                          className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                          style={{
                            left: `${20 + sparkleIndex * 15}%`,
                            top: `${15 + sparkleIndex * 20}%`,
                            animationDelay: `${sparkleIndex * 0.5}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Floating complete button */}
                {unlocked && !isCompleted && user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Button clicked for lesson:', lesson.id);
                      updateLessonProgress(lesson.id);
                    }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 rounded-full flex items-center justify-center text-white text-xs transition-all duration-300 z-30 shadow-lg hover:scale-110 hover:-translate-y-1 border-2 border-white/50"
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
        
        {/* End of path celebration */}
        {lessons.length > 0 && (
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: '50%',
              top: `${lessons.length * 180 + 100}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40 animate-bounce-gentle">
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