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

  // Calculate grid position for 2-column layout
  const calculateGridPosition = (index: number) => {
    const columnWidth = 180; // Width per column
    const verticalSpacing = 140; // Vertical distance between rows
    const row = Math.floor(index / 2);
    const isLeftColumn = index % 2 === 0;
    
    return {
      x: isLeftColumn ? -columnWidth / 2 : columnWidth / 2,
      y: row * verticalSpacing,
      row,
      isLeftColumn
    };
  };

  return (
    <div className="relative px-4 py-8 overflow-hidden bg-background">
      {/* Grid learning path container */}
      <div className="relative w-full max-w-2xl mx-auto min-h-screen">
        {/* Connection lines SVG */}
        <svg 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
          width="600" 
          height={`${Math.ceil(lessons.length / 2) * 140 + 200}`}
          style={{ zIndex: 0 }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
             refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" opacity="0.6" />
            </marker>
          </defs>
          
          {/* Draw connection paths */}
          {lessons.map((_, index) => {
            if (index === lessons.length - 1) return null; // No line after last lesson
            
            const currentPos = calculateGridPosition(index);
            const nextPos = calculateGridPosition(index + 1);
            
            const startX = 300 + currentPos.x;
            const startY = 80 + currentPos.y + 40; // Offset for node center
            const endX = 300 + nextPos.x;
            const endY = 80 + nextPos.y + 40;
            
            // Different path types based on layout
            if (currentPos.row === nextPos.row) {
              // Same row - straight horizontal line
              return (
                <line
                  key={`line-${index}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  opacity="0.6"
                  markerEnd="url(#arrowhead)"
                />
              );
            } else {
              // Different rows - L-shaped path
              const midY = startY + (endY - startY) / 2;
              return (
                <path
                  key={`line-${index}`}
                  d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.6"
                  markerEnd="url(#arrowhead)"
                />
              );
            }
          })}
        </svg>

        {/* Lesson nodes with grid positioning */}
        {lessons.map((lesson, index) => {
          const Icon = getLessonIcon(lesson.lesson_type, index);
          const isCompleted = isLessonCompleted(lesson.id);
          const unlocked = isLessonUnlocked(index);
          const position = calculateGridPosition(index);
          
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
                onClick={() => handleLessonClick(lesson, unlocked, isCompleted)}
              >
                {/* Enhanced 3D lesson orb */}
                <div className={`
                  relative w-20 h-20 rounded-2xl flex items-center justify-center
                  ${isCompleted 
                    ? 'bg-indigo-600 text-white border-[3px] border-indigo-700 shadow-[0px_4px_0px_0px] shadow-indigo-700' 
                    : unlocked
                    ? 'bg-indigo-600 text-white border-[3px] border-indigo-700 shadow-[0px_4px_0px_0px] shadow-indigo-700'
                    : 'bg-indigo-300 text-indigo-100 opacity-60 border-[3px] border-indigo-400 shadow-[0px_4px_0px_0px] shadow-indigo-400'
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
                
                {/* Lesson info card */}
                <div className="mt-4 text-center">
                  <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-border min-w-[160px] max-w-[200px]">
                    <p className="text-sm font-bold text-card-foreground leading-tight">
                      {lesson.title}
                    </p>
                  </div>
                </div>
                
                {/* Progress indicator for completed lessons */}
                {isCompleted && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-success/10 text-success text-xs px-2 py-1 rounded-full font-medium shadow-sm border border-success/20">
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
              top: `${80 + Math.ceil(lessons.length / 2) * 140 + 80}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="mt-3 text-center">
              <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-2 shadow-lg">
                <p className="text-sm font-bold text-warning-foreground">Поздравляем!</p>
                <p className="text-xs text-muted-foreground">Курс завершен</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPath;