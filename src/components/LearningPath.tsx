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
          const isLeftSide = index % 2 === 0;
          
          return (
            <div key={lesson.id} className="relative mb-8 last:mb-0">
              {/* Connecting line */}
              {index < lessons.length - 1 && (
                <div className={`
                  absolute w-0.5 h-12 bg-muted-foreground/20
                  ${isLeftSide ? 'left-8 top-16' : 'right-8 top-16'}
                `} />
              )}
              
              {/* Horizontal connector to center line */}
              {!isFirst && (
                <div className={`
                  absolute top-8 w-6 h-0.5 bg-muted-foreground/20
                  ${isLeftSide ? 'left-8' : 'right-8'}
                `} />
              )}
              
              {/* Lesson item */}
              <div 
                className={`flex items-center cursor-pointer group relative
                  ${isLeftSide ? 'flex-row' : 'flex-row-reverse'}
                `}
                onClick={() => handleLessonClick(lesson.id)}
              >
                {/* Lesson box */}
                <div className={`
                  relative w-16 h-16 rounded-2xl flex items-center justify-center 
                  transition-all duration-200 shadow-sm border-2
                  ${isFirst 
                    ? 'bg-primary text-primary-foreground border-primary/20 shadow-lg' 
                    : isCompleted
                    ? 'bg-success text-success-foreground border-success/20'
                    : 'bg-card text-muted-foreground border-border group-hover:border-primary/30 group-hover:bg-primary/5'
                  }
                  group-hover:scale-105 group-hover:shadow-md
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <Icon className="w-7 h-7" />
                  )}
                </div>
                
                {/* Lesson title */}
                <div className={`mx-4 max-w-[120px] ${isLeftSide ? 'text-left' : 'text-right'}`}>
                  <p className="text-sm font-medium text-foreground leading-tight mb-1">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
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