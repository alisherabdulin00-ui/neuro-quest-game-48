import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserCoinsDisplayProps {
  userId?: string;
  onCoinsUpdate?: (coins: number) => void;
}

interface UserCoins {
  total_coins: number;
}

const UserCoinsDisplay = ({ userId, onCoinsUpdate }: UserCoinsDisplayProps) => {
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserCoins(userId);
    }
  }, [userId]);

  const fetchUserCoins = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_coins')
        .select('total_coins')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user coins:', error);
        setCoins(0);
      } else {
        const newCoins = data?.total_coins || 0;
        setCoins(newCoins);
        onCoinsUpdate?.(newCoins);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
      setCoins(0);
    } finally {
      setLoading(false);
    }
  };

  // Method to refresh coins (callable by parent)
  const refreshCoins = () => {
    if (userId) {
      fetchUserCoins(userId);
    }
  };

  // Expose refresh method to parent
  useEffect(() => {
    (window as any).refreshUserCoins = refreshCoins;
    return () => {
      delete (window as any).refreshUserCoins;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-amber-400"></div>
        <span className="text-sm font-medium">...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm"></div>
      <span className="text-sm font-medium text-foreground">{coins}</span>
    </div>
  );
};

export default UserCoinsDisplay;