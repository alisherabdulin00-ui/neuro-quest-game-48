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
  chapter_id: string;
}
interface UserProgress {
  lesson_id: string;
  progress_percentage: number;
  completed: boolean;
  completed_at: string | null;
}
interface LearningPathProps {
  chapterId: string;
}
const LearningPath = ({
  chapterId
}: LearningPathProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  console.log('LearningPath render:', {
    chapterId,
    user: user?.id,
    userProgress: userProgress.length
  });
  useEffect(() => {
    checkUser();
  }, [chapterId]);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await Promise.all([fetchLessons(), fetchUserProgress(session.user.id)]);
    } else {
      await fetchLessons();
    }
  };
  const fetchLessons = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('lessons').select('*').eq('chapter_id', chapterId).order('order_index');
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
      const {
        data,
        error
      } = await supabase.from('user_progress').select('lesson_id, progress_percentage, completed, completed_at').eq('user_id', userId);
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
    console.log('updateLessonProgress called with:', {
      lessonId,
      completed,
      user: user?.id
    });
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для сохранения прогресса",
        variant: "destructive"
      });
      return;
    }
    try {
      console.log('Calling edge function with:', {
        lessonId,
        progressPercentage: 100,
        completed
      });
      const {
        data,
        error
      } = await supabase.functions.invoke('update-lesson-progress', {
        body: {
          lessonId,
          progressPercentage: 100,
          completed
        }
      });
      console.log('Edge function response:', {
        data,
        error
      });
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
        description: completed ? "Урок отмечен как завершенный" : "Ваш прогресс сохранен"
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

  const isCurrentLesson = (lessonIndex: number) => {
    // Current lesson is the first unlocked lesson that's not completed
    const isUnlocked = isLessonUnlocked(lessonIndex);
    const isCompleted = isLessonCompleted(lessons[lessonIndex].id);
    return isUnlocked && !isCompleted;
  };
  const getLessonIcon = (type: string, index: number) => {
    if (index === 0) return Play;
    switch (type) {
      case 'video':
        return Video;
      case 'reading':
        return BookOpen;
      case 'quiz':
        return FileText;
      default:
        return BookOpen;
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
    return <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }

  // Calculate zigzag position for structured learning path
  const calculateZigzagPosition = (index: number) => {
    const verticalSpacing = 140; // Vertical distance between lessons
    const horizontalOffset = 100; // Horizontal offset for left/right positions

    let x = 0; // Default center position

    // Pattern: Center (0) → Right (1) → Center (2) → Left (3) → Center (4) → Right (5) ...
    const position = index % 4;
    if (position === 1) {
      // Right position (1, 5, 9, 13...)
      x = horizontalOffset;
    } else if (position === 3) {
      // Left position (3, 7, 11, 15...)
      x = -horizontalOffset;
    }
    // else x remains 0 for center positions (0, 2, 4, 6...)

    const y = index * verticalSpacing;
    return {
      x,
      y
    };
  };
  return <div className="relative px-4 py-2 bg-background">
      {/* Curved learning path container */}
      <div className="relative w-full max-w-md mx-auto" style={{ minHeight: `${lessons.length * 140 + 400}px` }}>
      

        {/* Curved dashed connection path */}
        <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-40" width="400" height={`${lessons.length * 140 + 200}`} style={{
        zIndex: 0
      }}>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{
              stopColor: 'hsl(var(--primary))',
              stopOpacity: 0.6
            }} />
              <stop offset="100%" style={{
              stopColor: 'hsl(var(--primary))',
              stopOpacity: 0.3
            }} />
            </linearGradient>
          </defs>
          <path d={lessons.map((_, index) => {
          const pos = calculateZigzagPosition(index);
          const baseX = 200;
          const baseY = 80;
          if (index === 0) {
            return `M ${baseX + pos.x} ${baseY + pos.y + 40}`; // Start from bottom of first node
          } else {
            const prevPos = calculateZigzagPosition(index - 1);
            const currentX = baseX + pos.x;
            const currentY = baseY + pos.y - 40; // End at top of current node
            const prevX = baseX + prevPos.x;
            const prevY = baseY + prevPos.y + 40; // Start from bottom of previous node

            // Create smooth S-curve using cubic bezier
            const midY = (prevY + currentY) / 2;
            const controlPoint1X = prevX;
            const controlPoint1Y = prevY + 60;
            const controlPoint2X = currentX;
            const controlPoint2Y = currentY - 60;
            return `C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${currentX} ${currentY}`;
          }
        }).join(' ')} stroke="url(#pathGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="8 6" strokeDashoffset="0" />
        </svg>

        {/* Lesson nodes with curved positioning */}
        {lessons.map((lesson, index) => {
        const Icon = getLessonIcon(lesson.lesson_type, index);
        const isCompleted = isLessonCompleted(lesson.id);
        const unlocked = isLessonUnlocked(index);
        const isCurrent = isCurrentLesson(index);
        const position = calculateZigzagPosition(index);
        console.log(`Lesson ${lesson.title}:`, {
          id: lesson.id,
          isCompleted,
          unlocked,
          index
        });
        return <div key={lesson.id} className="absolute" style={{
          left: `calc(50% + ${position.x}px)`,
          top: `${80 + position.y}px`,
          transform: 'translateX(-50%)'
        }}>
              
              {/* Lesson node container */}
              <div className={`relative flex flex-col items-center group ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => handleLessonClick(lesson, unlocked, isCompleted)}>
                
                {/* Current lesson background indicator - only behind the node */}
                {isCurrent && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/30 to-primary/20 border border-primary/40" style={{ zIndex: -1 }} />
                )}
                
                {/* Enhanced 3D lesson orb */}
                <div className={`
                  relative w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300
                  ${isCompleted 
                    ? 'bg-indigo-600 text-white border-[3px] border-indigo-700 shadow-[0px_4px_0px_0px] shadow-indigo-700' 
                    : isCurrent 
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-white border-[3px] border-primary shadow-[0px_6px_0px_0px] shadow-primary/60' 
                      : unlocked 
                        ? 'bg-indigo-600 text-white border-[3px] border-indigo-700 shadow-[0px_4px_0px_0px] shadow-indigo-700' 
                        : 'bg-indigo-300 text-indigo-100 border-[3px] border-indigo-400 shadow-[0px_4px_0px_0px] shadow-indigo-400'
                  }
                `}>
                  
                  {/* Icon */}
                  <div className="relative z-20">
                    {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : unlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                  </div>
                </div>
                
                {/* Lesson title */}
                <div className="mt-3 text-center">
                  <p className="text-xs font-medium text-foreground leading-tight max-w-[120px]">
                    {lesson.title}
                  </p>
                </div>
              </div>
            </div>;
      })}
        

      </div>
    </div>;
};
export default LearningPath;