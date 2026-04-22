import { useState } from "react";
import { Clock, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTier } from "@/hooks/useTier";
import { UpgradeModal } from "./locked-content";

export function TrialBanner() {
  const { trialActive, trialDaysLeft, isStarter, tier } = useTier();
  const [dismissed, setDismissed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Show banner if: trial is active, OR user is on starter (trial expired)
  const showTrial = trialActive && !dismissed;
  const showStarter = isStarter && !trialActive && !dismissed;

  if (!showTrial && !showStarter) return null;

  if (showTrial) {
    const urgent = trialDaysLeft <= 2;
    return (
      <>
        <div className={`relative flex items-center gap-3 px-4 py-2.5 text-sm ${urgent ? "bg-red-600/20 border-b border-red-600/30" : "bg-[#FF6432]/10 border-b border-[#FF6432]/20"}`}>
          <Clock className={`w-4 h-4 shrink-0 ${urgent ? "text-red-400" : "text-[#FF6432]"}`} />
          <span className={`flex-1 font-medium ${urgent ? "text-red-300" : "text-[#EEF2F6]"}`}>
            {urgent
              ? `⚡ Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} — don't lose your Movement Blueprint`
              : `Your 7-day trial is active — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining`}
          </span>
          <Button
            size="sm"
            className="bg-[#FF6432] hover:bg-[#FF7A52] text-white text-xs font-bold uppercase tracking-wide px-3 h-7 shrink-0"
            onClick={() => setUpgradeOpen(true)}
          >
            <Zap className="w-3 h-3 mr-1" />
            Get Season Pass
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#6A8499] hover:text-[#EEF2F6] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} requiredTier="season_pass" />
      </>
    );
  }

  // Starter state — trial expired
  return (
    <>
      <div className="relative flex items-center gap-3 px-4 py-2.5 text-sm bg-[#0A0C12] border-b border-[#1A2D3F]">
        <div className="w-2 h-2 rounded-full bg-[#6A8499] shrink-0" />
        <span className="flex-1 text-[#6A8499]">
          Free plan — your Movement Blueprint and sessions are locked
        </span>
        <Button
          size="sm"
          variant="outline"
          className="border-[#FF6432]/40 text-[#FF6432] hover:bg-[#FF6432] hover:text-white text-xs font-bold uppercase tracking-wide px-3 h-7 shrink-0"
          onClick={() => setUpgradeOpen(true)}
        >
          Upgrade $149/yr
        </Button>
        <button onClick={() => setDismissed(true)} className="text-[#6A8499] hover:text-[#EEF2F6] shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} requiredTier="season_pass" />
    </>
  );
}
