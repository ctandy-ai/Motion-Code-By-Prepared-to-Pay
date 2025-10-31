import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal, Star } from "lucide-react";
import type { Achievement } from "@shared/schema";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  unlockedAt?: Date | null;
  className?: string;
}

function getRarityColor(rarity: string) {
  switch (rarity.toLowerCase()) {
    case "legendary":
      return "text-gold border-gold bg-gold/10";
    case "epic":
      return "text-xp border-xp bg-xp/10";
    case "rare":
      return "text-silver border-silver bg-silver/10";
    default:
      return "text-bronze border-bronze bg-bronze/10";
  }
}

function getRarityIcon(rarity: string) {
  switch (rarity.toLowerCase()) {
    case "legendary":
      return Trophy;
    case "epic":
      return Award;
    case "rare":
      return Medal;
    default:
      return Star;
  }
}

export function AchievementBadge({ 
  achievement, 
  unlocked = false,
  unlockedAt,
  className = "" 
}: AchievementBadgeProps) {
  const rarityColor = getRarityColor(achievement.rarity);
  const RarityIcon = getRarityIcon(achievement.rarity);

  return (
    <div 
      className={`
        group relative p-4 rounded-xl border-2 transition-all
        ${unlocked 
          ? `${rarityColor} hover-elevate cursor-pointer` 
          : 'border-muted/30 bg-muted/5 opacity-50 grayscale'
        }
        ${className}
      `}
      data-testid={`achievement-${achievement.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2.5 rounded-lg border-2 
          ${unlocked ? rarityColor : 'border-muted/20 bg-muted/10'}
        `}>
          <RarityIcon className={`h-6 w-6 ${unlocked ? '' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-heading font-bold text-sm" data-testid="text-achievement-name">
              {achievement.name}
            </h4>
            <Badge 
              variant="outline" 
              className={`text-xs ${unlocked ? rarityColor : 'text-muted-foreground'}`}
            >
              {achievement.rarity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2" data-testid="text-achievement-description">
            {achievement.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <span className={unlocked ? 'text-info' : 'text-muted-foreground'}>
                +{achievement.xpReward} XP
              </span>
            </div>
            {unlocked && unlockedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      {unlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-white/5 pointer-events-none" />
      )}
    </div>
  );
}
