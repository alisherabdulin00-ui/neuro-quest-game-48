import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Lesson {
  id: string;
  title: string;
  lesson_type: string;
  order_index: number;
  duration_minutes: number;
  chapter_id: string;
  points: number;
}

interface LessonTooltipProps {
  children: React.ReactNode;
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  onStart: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LessonTooltip = ({ 
  children, 
  lesson, 
  lessonIndex, 
  totalLessons, 
  onStart, 
  open, 
  onOpenChange 
}: LessonTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          sideOffset={15}
          className="bg-white border border-gray-200 shadow-xl rounded-2xl p-4 min-w-[280px] max-w-[320px]"
        >
          <div className="flex flex-col gap-3">
            {/* Lesson title */}
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {lesson.title}
            </h3>
            
            {/* Lesson progress and points */}
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Урок {lessonIndex + 1} из {totalLessons}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <span className="text-sm font-medium text-gray-700">+{lesson.points} очков</span>
              </div>
            </div>
            
            {/* Start button */}
            <Button 
              onClick={onStart}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              НАЧАТЬ
            </Button>
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LessonTooltip;