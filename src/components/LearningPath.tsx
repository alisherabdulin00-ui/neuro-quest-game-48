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
    <div className="relative">
      {/* Learning path with connecting lines */}
      <div className="relative max-w-sm mx-auto">
        {lessons.map((lesson, index) => {
          const Icon = getLessonIcon(lesson.lesson_type, index);
          const isFirst = index === 0;
          const isCompleted = false; // TODO: get from user progress
          
          return (
            <div key={lesson.id} className="relative mb-6 last:mb-0">
              {/* Connecting line */}
              {index < lessons.length - 1 && (
                <div className="absolute left-1/2 top-12 transform -translate-x-0.5 w-0.5 h-8 bg-gray-300" />
              )}
              
              {/* Lesson item */}
              <div 
                className={`flex flex-col items-center cursor-pointer group ${
                  index % 2 === 0 ? 'translate-x-0' : 'translate-x-4'
                }`}
                onClick={() => handleLessonClick(lesson.id)}
              >
                {/* Lesson box */}
                <div className={`
                  relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isFirst 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-600 group-hover:border-blue-300'
                  }
                  group-hover:scale-105 group-hover:shadow-md
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                {/* Lesson title */}
                <div className="mt-3 text-center px-2">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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