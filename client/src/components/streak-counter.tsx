import { Flame, Snowflake } from "lucide-react";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakCounter({ currentStreak, longestStreak, className = "" }: StreakCounterProps) {
  const isOnFire = currentStreak >= 7;
  const isFrozen = currentStreak === 0;

  return (
    <div className={`flex items-center gap-4 ${className}`} data-testid="streak-counter">
      <div className={`
        flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
        ${isOnFire 
          ? 'border-warning bg-gradient-to-br from-warning/20 to-warning/5 animate-pulse-glow' 
          : isFrozen 
            ? 'border-info/30 bg-info/5'
            : 'border-success/50 bg-success/10'
        }
      `}>
        {isFrozen ? (
          <Snowflake className="h-5 w-5 text-info" data-testid="icon-frozen" />
        ) : (
          <Flame 
            className={`h-5 w-5 ${isOnFire ? 'text-warning animate-bounce-subtle' : 'text-success'}`} 
            data-testid="icon-flame"
          />
        )}
        <div>
          <div className="font-display font-bold text-2xl" data-testid="text-current-streak">
            {currentStreak}
          </div>
          <div className="text-xs text-muted-foreground -mt-1">
            day streak
          </div>
        </div>
      </div>
      <div className="px-3 py-2 rounded-lg border border-muted/30 bg-muted/5">
        <div className="text-xs text-muted-foreground mb-0.5">Best</div>
        <div className="font-heading font-semibold text-lg text-gold" data-testid="text-longest-streak">
          {longestStreak}
        </div>
      </div>
    </div>
  );
}
