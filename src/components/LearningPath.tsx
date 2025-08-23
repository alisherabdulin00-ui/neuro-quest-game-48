import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, BookOpen, FileText, Video, CheckCircle2 } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  lesson_type: string;
  order_index: number;
  duration_minutes: number;
}

interface LearningPathProps {
  courseId: string;
}

const LearningPath = ({ courseId }: LearningPathProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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

    fetchLessons();
  }, [courseId]);

  const getLessonIcon = (type: string, index: number) => {
    if (index === 0) return Play;
    
    switch (type) {
      case 'video': return Video;
      case 'reading': return BookOpen;
      case 'quiz': return FileText;
      default: return BookOpen;
    }
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
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
          const isFirst = index === 0;
          const isCompleted = false; // TODO: get from user progress
          
          return (
            <div key={lesson.id} className="relative mb-16 last:mb-0">
              {/* Vertical connecting line */}
              {index < lessons.length - 1 && (
                <div className="absolute left-1/2 top-24 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/10 rounded-full" />
              )}
              
              {/* Lesson item - centered */}
              <div 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handleLessonClick(lesson.id)}
              >
                {/* Lesson box with 3D effect */}
                <div className={`
                  relative w-24 h-24 rounded-full flex items-center justify-center 
                  transition-all duration-300 transform
                  ${isFirst 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                    : isCompleted
                    ? 'bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg shadow-success/30'
                    : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground shadow-lg shadow-muted/30 group-hover:from-primary/20 group-hover:to-primary/10'
                  }
                  group-hover:scale-110 group-hover:-translate-y-1
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
                    ) : (
                      <Icon className="w-10 h-10 drop-shadow-sm" />
                    )}
                  </div>
                  
                  {/* Bottom shadow for 3D effect */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-3 bg-black/20 rounded-full blur-sm"></div>
                </div>
                
                {/* Lesson duration - под модулем */}
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold text-muted-foreground drop-shadow-sm">
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