import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, BookOpen, Heart, Zap, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { BlockRenderer, LessonBlock } from "@/components/LessonBlocks";

interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
}

interface Course {
  id: string;
  title: string;
}

const Lesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState(5);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) return;

      try {
        // Fetch lesson details
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        setLesson(lessonData);

        // Fetch chapter and course details  
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('course_id')
          .eq('id', lessonData.chapter_id)
          .single();

        if (chapterError) throw chapterError;

        // Fetch course details separately
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', chapterData.course_id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch lesson blocks
        const { data: blocksData, error: blocksError } = await supabase
          .from('lesson_blocks')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('order_index');

        if (blocksError) throw blocksError;
        setBlocks((blocksData || []) as LessonBlock[]);
      } catch (error) {
        console.error('Error fetching lesson data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId]);

  const currentBlock = blocks[currentBlockIndex];
  const progress = blocks.length > 0 ? ((currentBlockIndex + 1) / blocks.length) * 100 : 0;

  const handleNext = () => {
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      // Award XP for completing a block
      setXp(prev => prev + 10);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Navigate without saving progress if not logged in
        navigate('/dashboard');
        return;
      }

      // Save lesson completion progress
      const { error } = await supabase.functions.invoke('update-lesson-progress', {
        body: {
          lessonId: lesson?.id,
          progressPercentage: 100,
          completed: true
        }
      });

      if (error) {
        console.error('Error saving progress:', error);
      }

      // Award completion XP and streak
      setXp(prev => prev + 50);
      setStreak(prev => prev + 1);
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Урок не найден</h1>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-[0px_4px_0px_0px] shadow-indigo-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-600 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к курсам
          </Button>
        </div>
      </div>
    );
  }

  const isLastBlock = currentBlockIndex === blocks.length - 1;

  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden">
      {/* Duolingo-style Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 h-auto"
          >
            ✕
          </Button>
          
          <div className="flex-1 mx-4">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
            <span className="font-bold text-pink-500 text-lg">{hearts}</span>
          </div>
        </div>
      </div>

      {/* Clean Lesson Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-2xl mx-auto px-6 w-full h-full flex flex-col">
          {currentBlock ? (
            <BlockRenderer 
              block={currentBlock}
              onNext={handleNext}
              onComplete={handleComplete}
              isLastBlock={isLastBlock}
            />
          ) : blocks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Урок пуст</h3>
                <p className="text-gray-600">
                  Этот урок еще не содержит блоков.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Lesson;