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
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Загружаем урок...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Урок не найден</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLastBlock = currentBlockIndex === blocks.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header with Duolingo-style UI */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>

            {/* Hearts, XP, Streak */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                <span className="font-bold text-red-500">{hearts}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-500">{xp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-600">{streak}</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{lesson?.title}</span>
              <span className="text-sm text-muted-foreground">
                {currentBlockIndex + 1} / {blocks.length}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>

        {/* Block Content */}
        <div className="mb-8">
          {currentBlock ? (
            <BlockRenderer 
              block={currentBlock}
              onNext={handleNext}
              onComplete={handleComplete}
              isLastBlock={isLastBlock}
            />
          ) : blocks.length === 0 ? (
            <Card className="mb-8">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-4">Урок пуст</h3>
                <p className="text-muted-foreground">
                  Этот урок еще не содержит блоков.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Lesson;