import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StarIcon, LockClosedIcon, CheckIcon } from "@heroicons/react/24/solid";
import { getLevelAndProgress, generateLevelLadder, formatXP } from "@/lib/xp-calculations";

interface LevelProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalXP: number;
  level: number;
}

const LevelProgressModal = ({ open, onOpenChange, totalXP, level }: LevelProgressModalProps) => {
  const levelData = getLevelAndProgress(totalXP);
  const ladder = generateLevelLadder(totalXP, 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <StarIcon className="w-5 h-5 text-amber-400" />
            Ваш прогресс
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Status */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-foreground">Level {levelData.level}</div>
            <div className="text-lg text-muted-foreground">{formatXP(totalXP)} XP</div>
            {levelData.xpForNext > 0 && (
              <div className="text-sm text-muted-foreground">
                Нужно ещё {formatXP(levelData.xpForNext - levelData.xpInLevel)} XP до следующего уровня
              </div>
            )}
          </div>

          {/* Current Level Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {levelData.level}</span>
              <span>{formatXP(levelData.xpInLevel)}/{formatXP(levelData.xpForNext)}</span>
            </div>
            <Progress value={levelData.progress * 100} className="h-3" />
          </div>

          {/* Level Ladder */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">Лестница уровней</h4>
            <div className="space-y-2">
              {ladder.map((item) => (
                <div
                  key={item.level}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    item.isCurrent
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : item.isCompleted
                      ? 'bg-muted/50 border-muted'
                      : 'bg-muted/20 border-muted opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border">
                      {item.isCompleted ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      ) : item.isLocked ? (
                        <LockClosedIcon className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">Level {item.level}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatXP(item.totalXPRequired)} XP
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Текущий
                      </Badge>
                    )}
                    {item.isCompleted && !item.isCurrent && (
                      <Badge variant="outline" className="text-xs">
                        ✅
                      </Badge>
                    )}
                    {item.isLocked && (
                      <Badge variant="outline" className="text-xs">
                        🔒
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Message */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Продолжайте учиться, чтобы открыть новые уровни и награды! 🚀
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelProgressModal;