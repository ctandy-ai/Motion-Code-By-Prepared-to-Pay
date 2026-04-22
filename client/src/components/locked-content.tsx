import { useState } from "react";
import { Lock, Zap, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTier } from "@/hooks/useTier";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface LockedContentProps {
  requiredTier: "season_pass" | "pro";
  children: React.ReactNode;
  label?: string;
  blurChildren?: boolean;
  compact?: boolean;
}

export function LockedContent({ requiredTier, children, label, blurChildren = true, compact = false }: LockedContentProps) {
  const { canAccess, isLoading } = useTier();

  if (isLoading) return <>{children}</>;
  if (canAccess(requiredTier)) return <>{children}</>;

  return (
    <LockedOverlay requiredTier={requiredTier} label={label} blurChildren={blurChildren} compact={compact}>
      {children}
    </LockedOverlay>
  );
}

interface LockedOverlayProps {
  requiredTier: "season_pass" | "pro";
  children: React.ReactNode;
  label?: string;
  blurChildren: boolean;
  compact: boolean;
}

function LockedOverlay({ requiredTier, children, label, blurChildren, compact }: LockedOverlayProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative cursor-pointer group" onClick={() => setOpen(true)}>
        {blurChildren && (
          <div className="select-none pointer-events-none" style={{ filter: "blur(6px)", opacity: 0.4 }}>
            {children}
          </div>
        )}
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-[#0A0C12]/60 rounded-lg gap-2 ${compact ? "p-2" : "p-4"}`}>
          <div className="w-10 h-10 rounded-full bg-[#FF6432]/10 border border-[#FF6432]/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#FF6432]" />
          </div>
          {!compact && (
            <>
              <p className="text-[#EEF2F6] font-semibold text-sm text-center">
                {label || (requiredTier === "pro" ? "Pro Feature" : "Season Pass Feature")}
              </p>
              <Button
                size="sm"
                className="bg-[#FF6432] hover:bg-[#FF7A52] text-white text-xs font-bold uppercase tracking-wide px-4"
              >
                {requiredTier === "pro" ? "Upgrade to Pro" : "Get Season Pass"}
              </Button>
            </>
          )}
        </div>
      </div>
      <UpgradeModal open={open} onClose={() => setOpen(false)} requiredTier={requiredTier} />
    </>
  );
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  requiredTier?: "season_pass" | "pro";
}

export function UpgradeModal({ open, onClose, requiredTier = "season_pass" }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function checkout(plan: "season_pass" | "pro", billing: "annual" | "monthly") {
    setLoading(`${plan}_${billing}`);
    try {
      const res = await apiRequest("POST", "/api/checkout/session", { plan, billing }) as any;
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.code === "STRIPE_NOT_CONFIGURED") {
        toast({
          title: "Payment coming soon",
          description: "Stripe is being configured. Contact us to get early access.",
        });
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  const plans = [
    {
      id: "season_pass" as const,
      name: "Season Pass",
      badge: "MOST POPULAR",
      badgeColor: "bg-[#FF6432]",
      annual: 149,
      monthly: 14.99,
      currency: "AUD",
      icon: Zap,
      iconColor: "text-[#FF6432]",
      borderColor: "border-[#FF6432]/60",
      features: [
        "Full Movement Blueprint — 7-day personalised plan",
        "All sessions unlocked with session player",
        "Complete exercise library (White, Blue & Black belt)",
        "ACL prevention education hub",
        "Community — post, comment, connect",
        "Find a Clinic directory",
        "Achievement badges & belt progression",
      ],
      highlight: requiredTier === "season_pass",
    },
    {
      id: "pro" as const,
      name: "Pro",
      badge: "FOR COACHES",
      badgeColor: "bg-[#6A8499]",
      annual: 399,
      monthly: 39.99,
      currency: "AUD",
      icon: Star,
      iconColor: "text-amber-400",
      borderColor: "border-amber-400/40",
      features: [
        "Everything in Season Pass",
        "Enhanced program builder (52-week periodization)",
        "Team management & athlete compliance dashboard",
        "Coach messaging centre",
        "CPD certificate generation",
        "NSO compliance reporting",
        "Phase & wave week load budgets (P2P engine)",
        "Wellness check-in tracking",
      ],
      highlight: requiredTier === "pro",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0A0C12] border-[#1A2D3F] text-[#EEF2F6] p-0 overflow-hidden">
        <div className="p-6 border-b border-[#1A2D3F]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#FF6432]/10 border border-[#FF6432]/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#FF6432]" />
              </div>
              <DialogTitle className="text-[#EEF2F6] text-xl font-bold">
                Your Movement Blueprint is ready
              </DialogTitle>
            </div>
            <p className="text-[#6A8499] text-sm pl-11">
              Unlock your personalised 7-day training matrix and everything else on the platform.
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 ${plan.highlight ? plan.borderColor : "border-[#1A2D3F]"} bg-[#132130] p-5 flex flex-col gap-4`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-4 ${plan.badgeColor} text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded`}>
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  <span className="font-bold text-[#EEF2F6] text-base">{plan.name}</span>
                </div>

                <div>
                  <span className="text-3xl font-bold text-[#EEF2F6]">${plan.annual}</span>
                  <span className="text-[#6A8499] text-sm"> AUD/year</span>
                  <p className="text-[#6A8499] text-xs mt-0.5">or ${plan.monthly}/month</p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#EEF2F6]/80">
                      <span className="text-[#FF6432] mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button
                    className={`w-full font-bold uppercase tracking-wide text-sm ${plan.highlight ? "bg-[#FF6432] hover:bg-[#FF7A52] text-white" : "bg-[#1A2D3F] hover:bg-[#2a3d4f] text-[#EEF2F6] border border-[#6A8499]/30"}`}
                    disabled={!!loading}
                    onClick={() => checkout(plan.id, "annual")}
                  >
                    {loading === `${plan.id}_annual` ? "Opening..." : `Get ${plan.name} — $${plan.annual}/yr`}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[#6A8499] hover:text-[#EEF2F6] text-xs"
                    disabled={!!loading}
                    onClick={() => checkout(plan.id, "monthly")}
                  >
                    {loading === `${plan.id}_monthly` ? "Opening..." : `Monthly — $${plan.monthly}/mo`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-[#6A8499] text-xs">
            Part of an NSO? <button className="text-[#FF6432] hover:underline" onClick={() => { onClose(); navigate("/onboarding"); }}>Enter your organisation code</button> to unlock access.
          </p>
          <p className="text-[#6A8499] text-xs mt-1">Secure payment via Stripe · Cancel anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline lock badge (for lists, cards)
export function LockBadge({ requiredTier = "season_pass" }: { requiredTier?: "season_pass" | "pro" }) {
  const [open, setOpen] = useState(false);
  const { canAccess } = useTier();
  if (canAccess(requiredTier)) return null;
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-1 bg-[#FF6432]/10 border border-[#FF6432]/30 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#FF6432] uppercase tracking-wide"
      >
        <Lock className="w-2.5 h-2.5" />
        {requiredTier === "pro" ? "Pro" : "Season Pass"}
      </button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} requiredTier={requiredTier} />
    </>
  );
}
