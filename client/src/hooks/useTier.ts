import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

const TIER_RANK: Record<string, number> = {
  starter: 0,
  trial: 1,
  nso_granted: 2,
  season_pass: 2,
  pro: 3,
};

interface BillingStatus {
  tier: string;
  status: string;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  subscriptionExpiresAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string | null;
}

export function useTier() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: billing, isLoading: billingLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    enabled: !!user,
    staleTime: 30000,
  });

  const tier = billing?.tier || user?.subscriptionTier || "starter";
  const trialEndsAt = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null;
  const trialActive = tier === "trial" && trialEndsAt ? trialEndsAt > new Date() : false;
  const trialDaysLeft = billing?.trialDaysLeft ?? 0;

  // Effective tier: trial users count as season_pass while active
  const effectiveTier = trialActive ? "season_pass" : tier;

  function canAccess(requiredTier: "season_pass" | "pro"): boolean {
    return (TIER_RANK[effectiveTier] || 0) >= (TIER_RANK[requiredTier] || 0);
  }

  return {
    tier,
    effectiveTier,
    trialActive,
    trialDaysLeft,
    trialEndsAt,
    billing,
    isLoading: authLoading || billingLoading,
    canAccess,
    isSeasonPass: canAccess("season_pass"),
    isPro: canAccess("pro"),
    isStarter: effectiveTier === "starter",
    isNsoGranted: tier === "nso_granted",
  };
}
