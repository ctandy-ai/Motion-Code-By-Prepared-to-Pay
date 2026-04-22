import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Shield, Users, Award, ArrowRight, ExternalLink, Zap, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PartnerOrgPublic {
  id: number;
  name: string;
  slug: string;
  sportName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  welcomeMessage: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
}

export default function PartnerLanding() {
  const [, params] = useRoute("/join/:orgSlug");
  const orgSlug = params?.orgSlug;

  const { data: org, isLoading, error } = useQuery<PartnerOrgPublic>({
    queryKey: [`/api/partner-orgs/${orgSlug}`],
    enabled: !!orgSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center">
        <div className="animate-pulse text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Organisation Not Found</h1>
          <p className="text-gray-400 mb-6">The organisation you're looking for doesn't exist or is no longer active.</p>
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">Return to Motion Code</a>
        </div>
      </div>
    );
  }

  const primary = org.primaryColor || "#2563EB";
  const secondary = org.secondaryColor || "#0A0C12";

  const features = [
    {
      icon: Target,
      title: "Evidence-Based Training",
      desc: `Structured ${org.sportName.toLowerCase()} movement programs built on sports science research.`,
    },
    {
      icon: Zap,
      title: "Progressive Belt System",
      desc: "White → Blue → Black belt progression ensures safe, systematic skill development.",
    },
    {
      icon: Users,
      title: "Coach & Athlete Platform",
      desc: "Coaches assign programs, track compliance. Athletes follow guided sessions with video demos.",
    },
    {
      icon: Award,
      title: "Performance & Prevention",
      desc: "Improve speed, power, and agility while reducing injury risk through proper movement mechanics.",
    },
  ];

  return (
    <div className="min-h-screen bg-p2p-dark" style={{ "--partner-primary": primary, "--partner-secondary": secondary } as any}>
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org.logoUrl && (
              <img src={org.logoUrl} alt={org.name} className="h-10 object-contain" />
            )}
            <div>
              <h2 className="text-white font-heading font-bold text-lg leading-tight">{org.name}</h2>
              <p className="text-gray-400 text-xs">{org.sportName} · Movement Training</p>
            </div>
          </div>
          <a
            href={`/signup?org=${orgSlug}`}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: primary }}
          >
            Join Now <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white mb-6"
            style={{ background: `${primary}33`, border: `1px solid ${primary}55` }}
          >
            <Shield className="w-3.5 h-3.5" />
            Official {org.sportName} Partner
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            {org.welcomeMessage || `${org.sportName} Movement Training`}
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {org.description || `Join ${org.name}'s official movement training platform. Build speed, power, and resilience with evidence-based programs designed for ${org.sportName.toLowerCase()} athletes.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`/signup?org=${orgSlug}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all hover:opacity-90 shadow-lg"
              style={{ background: primary }}
            >
              Join Now <ArrowRight className="w-5 h-5" />
            </a>
            {org.website && (
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-gray-300 font-semibold text-lg border border-white/20 hover:border-white/40 transition-all"
              >
                Visit {org.name} <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white text-center mb-12">
            What You Get
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${primary}22` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: primary }} />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-6">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-left">
            {[
              { step: "1", title: "Sign Up", desc: `Create your free account through ${org.name}.` },
              { step: "2", title: "Get Your Program", desc: "Your coach assigns a tailored movement program." },
              { step: "3", title: "Train & Progress", desc: "Follow guided sessions, earn belts, track your progress." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3"
                  style={{ background: primary }}
                >
                  {item.step}
                </div>
                <h3 className="text-white font-heading font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-400 mb-8">
            Join {org.name}'s movement training platform today.
          </p>
          <a
            href={`/signup?org=${orgSlug}`}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-white font-bold text-lg transition-all hover:opacity-90 shadow-lg"
            style={{ background: primary }}
          >
            Join Now <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Powered by <a href="/" className="text-gray-400 hover:text-white transition-colors">Prepared to Play</a> · Motion Code Platform</span>
          </div>
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} {org.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
