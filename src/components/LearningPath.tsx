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

  // Calculate structured path positions to match the image layout
  const calculatePathPosition = (index: number) => {
    const containerWidth = 280;
    const verticalSpacing = 200;
    
    // Pattern based on the image: center -> center -> left -> right -> center...
    let x = 0;
    
    if (index === 0) {
      // First lesson (START) at center top
      x = 0;
    } else if (index === 1) {
      // Second lesson stays center
      x = 0;
    } else if (index === 2) {
      // Third lesson goes to the left
      x = -containerWidth * 0.4;
    } else if (index === 3) {
      // Fourth lesson goes to the right
      x = containerWidth * 0.4;
    } else {
      // For more lessons, alternate left-right
      x = (index % 2 === 0) ? -containerWidth * 0.4 : containerWidth * 0.4;
    }
    
    const y = index * verticalSpacing;
    
    return { x, y };
  };

  // Generate path connections
  const generatePathConnections = () => {
    if (lessons.length <= 1) return "";
    
    let pathData = "";
    
    for (let i = 0; i < lessons.length - 1; i++) {
      const currentPos = calculatePathPosition(i);
      const nextPos = calculatePathPosition(i + 1);
      
      const startX = currentPos.x;
      const startY = currentPos.y + 40; // Offset for node radius
      const endX = nextPos.x;
      const endY = nextPos.y - 40; // Offset for node radius
      
      // Create curved path between nodes
      const midY = (startY + endY) / 2;
      const controlPoint1X = startX;
      const controlPoint1Y = midY;
      const controlPoint2X = endX;
      const controlPoint2Y = midY;
      
      if (i === 0) {
        pathData = `M ${startX} ${startY}`;
      }
      
      pathData += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    }
    
    return pathData;
  };

  return (
    <div className="relative px-4 py-8 overflow-hidden bg-background">
      {/* Structured learning path container */}
      <div className="relative w-full max-w-md mx-auto min-h-screen">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full animate-pulse"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i * 150)}px`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Path connections SVG */}
        <svg 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
          width="500" 
          height={`${lessons.length * 200 + 200}`}
          style={{ zIndex: 0 }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(129 140 248)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="rgb(129 140 248)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(129 140 248)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path
            d={generatePathConnections()}
            stroke="url(#pathGradient)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="12,8"
            className="animate-pulse"
          />
        </svg>

        {/* Lesson nodes with structured positioning */}
        {lessons.map((lesson, index) => {
          const Icon = getLessonIcon(lesson.lesson_type, index);
          const isCompleted = isLessonCompleted(lesson.id);
          const unlocked = isLessonUnlocked(index);
          const position = calculatePathPosition(index);
          
          console.log(`Lesson ${lesson.title}:`, { id: lesson.id, isCompleted, unlocked, index });
          
          return (
            <div
              key={lesson.id}
              className="absolute transition-all duration-500 ease-in-out"
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `${80 + position.y}px`,
                transform: 'translateX(-50%)'
              }}
            >
              
              {/* Lesson node container */}
              <div 
                className={`relative flex flex-col items-center group ${unlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'} transition-transform duration-300`}
                onClick={() => handleLessonClick(lesson, unlocked, isCompleted)}
              >
                {/* Enhanced lesson node */}
                <div className={`
                  relative w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/30' 
                    : unlocked
                    ? index === 2 // Third lesson (blue in image)
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1'
                      : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/30 hover:shadow-green-500/40 hover:-translate-y-1'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500 text-slate-200 opacity-60 shadow-slate-500/20'
                  }
                `}>
                  
                  {/* Glow effect for unlocked lessons */}
                  {unlocked && !isCompleted && (
                    <div className={`absolute inset-0 rounded-3xl opacity-30 animate-ping ${
                      index === 2 ? 'bg-blue-400' : 'bg-green-400'
                    }`}></div>
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-20">
                    {isCompleted ? (
                      <CheckCircle2 className="w-10 h-10" />
                    ) : unlocked ? (
                      <Icon className="w-10 h-10" />
                    ) : (
                      <Lock className="w-10 h-10" />
                    )}
                  </div>

                  {/* Special styling for first lesson */}
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      START
                    </div>
                  )}
                </div>
                
                {/* Lesson info card */}
                <div className="mt-6 text-center max-w-[160px]">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-gray-200 transition-all duration-300 group-hover:shadow-2xl">
                    <p className="text-sm font-bold text-gray-800 mb-2 leading-tight">
                      {lesson.title}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-2">
                      <span>⏱️</span>
                      {lesson.duration_minutes} мин
                    </p>
                  </div>
                </div>
                
                {/* Progress indicator for completed lessons */}
                {isCompleted && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium shadow-lg border border-green-200">
                      Завершено! ✅
                    </div>
                  </div>
                )}

                {/* Connection indicator */}
                {index < lessons.length - 1 && (
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`w-1 h-8 ${isCompleted ? 'bg-green-400' : 'bg-indigo-300'} rounded-full`}></div>
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
              top: `${100 + lessons.length * 200 + 100}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-pulse">
              <span className="text-3xl">🏆</span>
            </div>
            <div className="mt-4 text-center">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg px-6 py-3 shadow-lg">
                <p className="text-lg font-bold text-yellow-800">Поздравляем!</p>
                <p className="text-sm text-orange-700">Курс завершен успешно</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPath;