import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] overflow-y-auto bg-background rounded-t-3xl border-t border-border"
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center justify-center gap-2 text-xl">
            <StarIcon className="w-6 h-6 text-amber-400" />
            Ваш прогресс
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-8 pb-6">
          {/* Current Status Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 text-center space-y-3 border border-primary/20">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30">
              <StarIcon className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-foreground">Level {levelData.level}</div>
              <div className="text-lg text-primary font-medium">{formatXP(totalXP)} XP</div>
              {levelData.xpForNext > 0 && (
                <div className="text-sm text-muted-foreground">
                  Нужно ещё {formatXP(levelData.xpForNext - levelData.xpInLevel)} XP до следующего уровня
                </div>
              )}
            </div>
          </div>

          {/* Current Level Progress */}
          {levelData.xpForNext > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Прогресс уровня
              </h4>
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Level {levelData.level}</span>
                  <span>{formatXP(levelData.xpInLevel)}/{formatXP(levelData.xpForNext)}</span>
                </div>
                <Progress value={levelData.progress * 100} className="h-3 bg-muted" />
                <div className="text-center text-xs text-muted-foreground">
                  {Math.round(levelData.progress * 100)}% завершено
                </div>
              </div>
            </div>
          )}

          {/* Level Ladder */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Лестница уровней
            </h4>
            <div className="space-y-3">
              {ladder.map((item, index) => (
                <div
                  key={item.level}
                  className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    item.isCurrent
                      ? 'bg-primary/15 border-primary shadow-lg scale-105'
                      : item.isCompleted
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-muted/30 border-muted opacity-60'
                  }`}
                >
                  {/* Level indicator line */}
                  {index > 0 && (
                    <div className="absolute -top-3 left-6 w-0.5 h-3 bg-gradient-to-t from-primary/40 to-transparent" />
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      item.isCurrent 
                        ? 'bg-primary/20 border-primary' 
                        : item.isCompleted 
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-400' 
                        : 'bg-muted border-muted-foreground/30'
                    }`}>
                      {item.isCompleted ? (
                        <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : item.isLocked ? (
                        <LockClosedIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">Level {item.level}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatXP(item.totalXPRequired)} XP
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.isCurrent && (
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/40">
                        Текущий
                      </Badge>
                    )}
                    {item.isCompleted && !item.isCurrent && (
                      <Badge variant="outline" className="text-xs border-green-300 text-green-600 dark:border-green-700 dark:text-green-400">
                        Завершен
                      </Badge>
                    )}
                    {item.isLocked && (
                      <Badge variant="outline" className="text-xs">
                        Заблокирован
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 text-center border border-primary/20">
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-sm font-medium text-foreground mb-1">
              Продолжайте учиться!
            </p>
            <p className="text-xs text-muted-foreground">
              Каждый урок приближает вас к новому уровню и достижениям
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LevelProgressModal;