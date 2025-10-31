import { Progress } from "@/components/ui/progress";
import { Trophy, Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  level: number;
  className?: string;
}

function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function XPBar({ currentXP, level, className = "" }: XPBarProps) {
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgressInCurrentLevel = currentXP - xpForCurrentLevel;
  const progressPercentage = Math.min(100, Math.max(0, (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100));

  return (
    <div className={`space-y-2 ${className}`} data-testid="xp-bar-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-xp/20 to-info/20 border border-xp/30">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="font-display font-bold text-lg text-xp" data-testid="text-level">
              LVL {level}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-info" />
            <span className="text-sm font-medium" data-testid="text-xp-progress">
              {xpProgressInCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {Math.round(progressPercentage)}% to Level {level + 1}
        </div>
      </div>
      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className="h-3 bg-muted/30"
          data-testid="progress-xp"
        />
        <div 
          className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-xp via-info to-xp bg-[length:200%_100%] animate-shimmer opacity-30 pointer-events-none"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
