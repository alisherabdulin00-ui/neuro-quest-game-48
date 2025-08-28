import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserPointsDisplayProps {
  userId?: string;
}

interface UserPoints {
  total_points: number;
}

const UserPointsDisplay = ({ userId }: UserPointsDisplayProps) => {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserPoints(userId);
    }
  }, [userId]);

  const fetchUserPoints = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user points:', error);
        setPoints(0);
      } else {
        setPoints(data?.total_points || 0);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      setPoints(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
        <span className="text-sm font-medium">...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
      <span className="text-sm font-medium text-foreground">{points}</span>
    </div>
  );
};

export default UserPointsDisplay;