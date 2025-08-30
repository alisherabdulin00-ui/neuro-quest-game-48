import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { StarIcon, FireIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getXPRewards } from "@/lib/xp-calculations";

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
  userId?: string;
}

const LessonTooltip = ({ 
  children, 
  lesson, 
  lessonIndex, 
  totalLessons, 
  onStart, 
  open, 
  onOpenChange,
  userId 
}: LessonTooltipProps) => {
  const [userExperience, setUserExperience] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>({});
  
  useEffect(() => {
    if (userId && open) {
      fetchUserData();
    }
  }, [userId, open]);
  
  const fetchUserData = async () => {
    try {
      // Fetch user experience for streak calculation
      const { data: expData } = await supabase
        .from('user_experience')
        .select('streak_count')
        .eq('user_id', userId!)
        .single();
      
      // Fetch system settings for XP values
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['xp_per_lesson', 'xp_streak_bonus']);
      
      setUserExperience(expData);
      
      const settings = settingsData?.reduce((acc, setting) => {
        acc[setting.setting_key] = parseInt(String(setting.setting_value));
        return acc;
      }, {} as any) || {};
      setSystemSettings(settings);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const calculateDynamicXP = () => {
    const baseXP = systemSettings.xp_per_lesson || 10;
    const streakBonus = systemSettings.xp_streak_bonus || 5;
    const currentStreak = userExperience?.streak_count || 0;
    
    // Calculate streak bonus (applied daily, not per lesson)
    const dailyStreakBonus = currentStreak > 0 ? streakBonus * currentStreak : 0;
    
    return {
      baseXP,
      streakBonus: dailyStreakBonus,
      total: baseXP + (currentStreak > 0 ? Math.min(dailyStreakBonus, 25) : 0) // Cap streak bonus at 25 XP
    };
  };
  
  const xpBreakdown = calculateDynamicXP();
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          sideOffset={15}
          className="bg-white border border-gray-200 shadow-xl rounded-2xl p-4 min-w-[300px] max-w-[340px]"
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
            
            {/* Dynamic XP Breakdown */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1 mb-2">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-800">Награда за прохождение</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3 text-amber-400" />
                    <span className="text-gray-600">Базовый XP</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">+{xpBreakdown.baseXP} XP</Badge>
                </div>
                
                {userExperience?.streak_count > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <FireIcon className="w-3 h-3 text-orange-500" />
                      <span className="text-gray-600">Streak бонус (сегодня)</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-orange-600">
                      +{Math.min(xpBreakdown.streakBonus, 25)} XP
                    </Badge>
                  </div>
                )}
                
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-gray-700">Всего XP</span>
                    <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500">
                      +{xpBreakdown.total} XP
                    </Badge>
                  </div>
                </div>
              </div>
              
              {!userId && (
                <p className="text-xs text-gray-500 italic mt-2">
                  Войдите в аккаунт, чтобы видеть персональные бонусы
                </p>
              )}
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