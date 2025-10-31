import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Zap, CheckCircle2 } from "lucide-react";
import type { DailyChallenge } from "@shared/schema";

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  progress?: number;
  completed?: boolean;
  onAccept?: () => void;
  className?: string;
}

export function DailyChallengeCard({ 
  challenge, 
  progress = 0,
  completed = false,
  onAccept,
  className = "" 
}: DailyChallengeCardProps) {
  const progressPercentage = (progress / challenge.targetValue) * 100;

  return (
    <Card 
      className={`
        overflow-hidden border-2 transition-all
        ${completed 
          ? 'border-success bg-success/5' 
          : 'border-warning bg-gradient-to-br from-warning/10 to-transparent hover-elevate'
        }
        ${className}
      `}
      data-testid={`challenge-card-${challenge.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`
              p-2 rounded-lg border-2
              ${completed ? 'border-success bg-success/20' : 'border-warning bg-warning/20'}
            `}>
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-success" data-testid="icon-completed" />
              ) : (
                <Target className="h-5 w-5 text-warning" data-testid="icon-target" />
              )}
            </div>
            <CardTitle className="text-lg font-heading" data-testid="text-challenge-title">
              {challenge.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-info/20 border border-info/30">
            <Zap className="h-3 w-3 text-info" />
            <span className="text-sm font-bold text-info" data-testid="text-xp-reward">
              +{challenge.xpReward}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground" data-testid="text-challenge-description">
          {challenge.description}
        </p>
        
        {!completed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold" data-testid="text-progress">
                {progress} / {challenge.targetValue}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" data-testid="progress-challenge" />
          </div>
        )}

        {completed && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-semibold">Challenge Completed!</span>
          </div>
        )}

        {!completed && onAccept && progress === 0 && (
          <Button 
            onClick={onAccept}
            variant="outline"
            className="w-full border-warning text-warning hover:bg-warning/10"
            data-testid="button-accept-challenge"
          >
            Accept Challenge
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
