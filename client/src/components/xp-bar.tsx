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
    <div className={`space-y-3 ${className}`} data-testid="xp-bar-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-semibold text-base text-foreground" data-testid="text-level">
              Level {level}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-sm" data-testid="text-xp-progress">
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
          className="h-2 bg-muted"
          data-testid="progress-xp"
        />
      </div>
    </div>
  );
}
