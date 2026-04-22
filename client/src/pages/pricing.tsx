import { useState } from "react";
import { Link } from "wouter";
import { Check, Zap, Star, Building2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTier } from "@/hooks/useTier";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    priceNote: "7-day full trial, then free tier",
    icon: Lock,
    iconColor: "text-[#6A8499]",
    borderColor: "border-[#1A2D3F]",
    features: [
      "Create an account & athlete profile",
      "7-day full Season Pass trial",
      "View exercise library",
      "Browse education modules",
      "Explore platform",
    ],
    cta: "Start Free Trial",
    ctaStyle: "bg-[#1A2D3F] hover:bg-[#2a3d4f] text-[#EEF2F6] border border-[#6A8499]/30",
    href: "/signup",
    locked: [],
  },
  {
    id: "season_pass",
    name: "Season Pass",
    badge: "MOST POPULAR",
    price: "$149",
    priceNote: "AUD/year or $14.99/month",
    icon: Zap,
    iconColor: "text-[#FF6432]",
    borderColor: "border-[#FF6432]/60",
    features: [
      "Movement Blueprint — personalised 7-day plan",
      "All sessions — full session player",
      "Complete exercise library (White, Blue & Black belt)",
      "ACL prevention education hub — all modules",
      "Community — post, comment, connect with athletes",
      "Find a Clinic — Prepared to Play directory",
      "Achievement badges & belt progression",
      "NSO compliance pathways",
    ],
    cta: "Get Season Pass",
    ctaStyle: "bg-[#FF6432] hover:bg-[#FF7A52] text-white",
    plan: "season_pass",
    locked: [],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "FOR COACHES",
    price: "$399",
    priceNote: "AUD/year or $39.99/month",
    icon: Star,
    iconColor: "text-amber-400",
    borderColor: "border-amber-400/40",
    features: [
      "Everything in Season Pass",
      "Enhanced program builder (52-week periodization)",
      "Phase & wave week load budgets (P2P engine)",
      "Team management & athlete roster",
      "Compliance dashboard — athlete tracking",
      "Coach messaging centre",
      "CPD certificate generation",
      "Wellness check-in tracking",
      "Audit logging (enterprise compliance)",
    ],
    cta: "Get Pro",
    ctaStyle: "bg-amber-500 hover:bg-amber-400 text-black",
    plan: "pro",
    locked: [],
  },
  {
    id: "club",
    name: "Club / Team",
    price: "Contact us",
    priceNote: "Custom pricing for organisations",
    icon: Building2,
    iconColor: "text-blue-400",
    borderColor: "border-blue-400/30",
    features: [
      "Everything in Pro",
      "Multiple coach seats",
      "Unlimited athlete access",
      "Dedicated account manager",
      "Custom NSO onboarding",
      "White-label configuration",
      "VALD force plate integration",
      "Normative benchmark database",
    ],
    cta: "Contact Us",
    ctaStyle: "bg-blue-600 hover:bg-blue-500 text-white",
    href: "mailto:hello@preparedtoplay.com.au",
    locked: [],
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { effectiveTier } = useTier();

  async function checkout(plan: "season_pass" | "pro") {
    if (!user) {
      window.location.href = "/signup";
      return;
    }
    setLoading(plan);
    try {
      const res = await apiRequest("POST", "/api/checkout/session", { plan, billing }) as any;
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.code === "STRIPE_NOT_CONFIGURED") {
        toast({ title: "Payment coming soon", description: "We're finalising payment setup. Contact us for early access." });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0C12] text-[#EEF2F6]">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#FF6432]/10 border border-[#FF6432]/20 rounded-full px-4 py-1.5 text-[#FF6432] text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight mb-4">
            Move Better.<br />
            <span className="text-[#FF6432]">Pay Less</span> Than One Physio Visit.
          </h1>
          <p className="text-[#6A8499] text-lg max-w-2xl mx-auto">
            A full season of personalised movement education, ACL prevention and belt progression — for less than the cost of a single physio appointment.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center bg-[#132130] rounded-full p-1 gap-1">
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billing === "annual" ? "bg-[#FF6432] text-white" : "text-[#6A8499] hover:text-[#EEF2F6]"}`}
            >
              Annual
              <span className="ml-1.5 text-xs bg-[#FF6432]/20 text-[#FF6432] px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billing === "monthly" ? "bg-[#FF6432] text-white" : "text-[#6A8499] hover:text-[#EEF2F6]"}`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = effectiveTier === tier.id;
            const price = tier.id === "season_pass"
              ? billing === "annual" ? "$149 AUD/yr" : "$14.99 AUD/mo"
              : tier.id === "pro"
              ? billing === "annual" ? "$399 AUD/yr" : "$39.99 AUD/mo"
              : tier.price;

            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border-2 ${tier.borderColor} bg-[#132130] p-5 flex flex-col gap-4`}
              >
                {(tier as any).badge && (
                  <div className="absolute -top-3 left-4 bg-[#FF6432] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {(tier as any).badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-[#6A8499] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Current plan
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                  <span className="font-bold text-[#EEF2F6]">{tier.name}</span>
                </div>

                <div>
                  <div className="text-2xl font-extrabold text-[#EEF2F6]">{price}</div>
                  <p className="text-[#6A8499] text-xs mt-0.5">{tier.priceNote}</p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#EEF2F6]/80">
                      <Check className="w-3 h-3 text-[#FF6432] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {(tier as any).plan ? (
                  <Button
                    className={`w-full font-bold uppercase tracking-wide text-sm ${tier.ctaStyle}`}
                    disabled={!!loading || isCurrent}
                    onClick={() => checkout((tier as any).plan)}
                  >
                    {loading === (tier as any).plan ? "Opening..." : isCurrent ? "Current Plan" : tier.cta}
                    {!isCurrent && !loading && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                ) : tier.href?.startsWith("mailto") ? (
                  <a href={tier.href}>
                    <Button className={`w-full font-bold uppercase tracking-wide text-sm ${tier.ctaStyle}`}>
                      {tier.cta}
                    </Button>
                  </a>
                ) : (
                  <Link href={tier.href || "/signup"}>
                    <Button className={`w-full font-bold uppercase tracking-wide text-sm ${tier.ctaStyle}`}>
                      {isCurrent ? "Current Plan" : tier.cta}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* NSO callout */}
        <div className="mt-12 bg-[#132130] border border-[#1A2D3F] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#EEF2F6] text-lg mb-1">Part of Netball Australia, AFL, or Basketball Australia?</h3>
            <p className="text-[#6A8499] text-sm">NSO members get Season Pass access included through their organisation — no credit card needed.</p>
          </div>
          <Link href="/onboarding">
            <Button className="bg-[#FF6432] hover:bg-[#FF7A52] text-white font-bold uppercase tracking-wide shrink-0">
              Enter Organisation Code
            </Button>
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid md:grid-cols-2 gap-6 text-sm">
          {[
            { q: "What happens after the 7-day trial?", a: "Your account moves to the free Starter tier. Your profile and progress are saved. Upgrade anytime to unlock your Blueprint and all content." },
            { q: "Can I cancel anytime?", a: "Yes. Annual plans give you access for the full year. Monthly plans can be cancelled at any time and won't renew." },
            { q: "How does the NSO model work?", a: "NSOs pay a platform licence that covers Season Pass access for all their registered athletes. Athletes sign up with their NSO code at onboarding." },
            { q: "What's included in the P2P program engine?", a: "Pro coaches get a 52-week periodization builder with phase awareness (Pre-season, In-season, Bye Week), wave loading, and belt-based load budgets — the system tells you exactly how much plyo contact and strength work each athlete should be doing." },
          ].map((item, i) => (
            <div key={i} className="bg-[#132130] border border-[#1A2D3F] rounded-lg p-4">
              <p className="font-semibold text-[#EEF2F6] mb-1">{item.q}</p>
              <p className="text-[#6A8499]">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
