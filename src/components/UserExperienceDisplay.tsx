import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarIcon, FireIcon } from "@heroicons/react/24/solid";

interface UserExperienceDisplayProps {
  userId?: string;
  onExperienceUpdate?: (xp: number, level: number, streak: number) => void;
}

interface UserExperience {
  total_xp: number;
  level: number;
  streak_count: number;
}

const UserExperienceDisplay = ({ userId, onExperienceUpdate }: UserExperienceDisplayProps) => {
  const [experience, setExperience] = useState<UserExperience>({ total_xp: 0, level: 1, streak_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserExperience(userId);
    }
  }, [userId]);

  const fetchUserExperience = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_experience')
        .select('total_xp, level, streak_count')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user experience:', error);
        setExperience({ total_xp: 0, level: 1, streak_count: 0 });
      } else {
        const newExperience = data || { total_xp: 0, level: 1, streak_count: 0 };
        setExperience(newExperience);
        onExperienceUpdate?.(newExperience.total_xp, newExperience.level, newExperience.streak_count);
      }
    } catch (error) {
      console.error('Error fetching experience:', error);
      setExperience({ total_xp: 0, level: 1, streak_count: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Method to refresh experience (callable by parent)
  const refreshExperience = () => {
    if (userId) {
      fetchUserExperience(userId);
    }
  };

  // Expose refresh method to parent
  useEffect(() => {
    (window as any).refreshUserExperience = refreshExperience;
    return () => {
      delete (window as any).refreshUserExperience;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">Level ...</span>
        </div>
        {experience.streak_count > 0 && (
          <div className="flex items-center gap-1">
            <FireIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">...</span>
          </div>
        )}
      </div>
    );
  }

  // Calculate progress to next level
  const currentLevelXP = (experience.level - 1) * 100;
  const nextLevelXP = experience.level * 100;
  const progressXP = experience.total_xp - currentLevelXP;
  const progressPercentage = (progressXP / 100) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <StarIcon className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-foreground">Level {experience.level}</span>
      </div>
      
      {/* XP Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{progressXP}/100</span>
      </div>

      {/* Streak Counter */}
      {experience.streak_count > 0 && (
        <div className="flex items-center gap-1">
          <FireIcon className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-foreground">{experience.streak_count}</span>
        </div>
      )}
    </div>
  );
};

export default UserExperienceDisplay;