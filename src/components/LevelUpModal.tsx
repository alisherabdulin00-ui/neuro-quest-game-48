import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLevel: number;
  previousLevel: number;
}

const LevelUpModal = ({ open, onOpenChange, newLevel, previousLevel }: LevelUpModalProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (open) {
      setShowAnimation(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto border-none bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="text-center space-y-6 p-6">
          {/* Animated Stars */}
          <div className="relative">
            <div className={`transition-all duration-1000 ${showAnimation ? 'scale-110 rotate-12' : 'scale-100'}`}>
              <StarIcon className="w-20 h-20 mx-auto text-amber-400 drop-shadow-lg" />
            </div>
            {showAnimation && (
              <>
                <SparklesIcon className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-ping" />
                <SparklesIcon className="w-4 h-4 text-orange-400 absolute -bottom-1 -left-2 animate-ping" style={{ animationDelay: '0.5s' }} />
                <SparklesIcon className="w-5 h-5 text-yellow-400 absolute top-2 -left-3 animate-ping" style={{ animationDelay: '1s' }} />
              </>
            )}
          </div>

          {/* Congratulations Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground animate-fade-in">
              Поздравляем! 🎉
            </h2>
            <p className="text-muted-foreground">
              Вы достигли нового уровня!
            </p>
          </div>

          {/* Level Display */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              Level {newLevel}
            </div>
            {previousLevel > 0 && (
              <div className="text-sm text-muted-foreground">
                {previousLevel} → {newLevel}
              </div>
            )}
          </div>

          {/* Rewards Section */}
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-foreground">
              Новые возможности разблокированы:
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Доступ к новым функциям</div>
              <div>• Специальные бейджи</div>
              <div>• Бонусы за активность</div>
            </div>
          </div>

          {/* Continue Button */}
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
          >
            Продолжить обучение
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelUpModal;