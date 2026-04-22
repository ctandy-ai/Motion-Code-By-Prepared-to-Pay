import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, CheckCircle2, Loader2, ArrowRight, Building2 } from "lucide-react";
import logoImage from "@assets/download_1753006535107.png";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  orgCode: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

interface PartnerOrgInfo {
  name: string;
  slug: string;
  sport: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score === 3) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function Signup() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [partnerOrg, setPartnerOrg] = useState<PartnerOrgInfo | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const searchParams = new URLSearchParams(searchString);
  const sportParam = searchParams.get("sport");
  const orgParam = searchParams.get("org");

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      orgCode: "",
    },
  });

  useEffect(() => {
    if (orgParam) {
      resolveOrgBySlug(orgParam);
    }
  }, [orgParam]);

  async function resolveOrgBySlug(slug: string) {
    try {
      setIsValidatingCode(true);
      const res = await fetch(`/api/partner-orgs/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setPartnerOrg({
          name: data.name,
          slug: data.slug,
          sport: data.sportName,
          welcomeMessage: data.welcomeMessage || "",
          primaryColor: data.primaryColor || "#2563EB",
          secondaryColor: data.secondaryColor || "#0A0C12",
          logoUrl: data.logoUrl,
        });
      }
    } catch {} finally {
      setIsValidatingCode(false);
    }
  }

  async function validateOrgCode(code: string) {
    if (!code || code.trim().length === 0) {
      setPartnerOrg(null);
      setCodeError(null);
      return;
    }
    try {
      setIsValidatingCode(true);
      setCodeError(null);
      const res = await fetch(`/api/partner-orgs/validate/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setPartnerOrg(data);
        setCodeError(null);
      } else {
        setPartnerOrg(null);
        setCodeError("Invalid organisation code. Check it and try again.");
      }
    } catch {
      setPartnerOrg(null);
      setCodeError("Could not validate code. Please try again.");
    } finally {
      setIsValidatingCode(false);
    }
  }

  async function onSubmit(data: SignupForm) {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/auth/signup", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      const result = await res.json();

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        const params = new URLSearchParams();
        if (sportParam) params.set("sport", sportParam);
        if (partnerOrg) params.set("org", partnerOrg.slug);
        const queryStr = params.toString();
        navigate(`/onboarding${queryStr ? `?${queryStr}` : ""}`);
      }
    } catch (error: any) {
      toast({
        title: "Could not create account",
        description: error.message || "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const strength = getPasswordStrength(passwordValue);

  return (
    <div className="min-h-screen bg-p2p-dark flex">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-p2p-darker via-p2p-dark to-black border-r border-p2p-border flex-col justify-between p-12">
        <div>
          <img src={logoImage} alt="Prepared to Play" className="h-12 object-contain" />
        </div>
        <div>
          {partnerOrg ? (
            <>
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <Building2 className="w-3.5 h-3.5" style={{ color: partnerOrg.primaryColor }} />
                <span className="text-sm font-medium" style={{ color: partnerOrg.primaryColor }}>
                  {partnerOrg.name}
                </span>
              </div>
              <h2 className="font-heading text-5xl font-bold text-white leading-tight mb-6">
                {partnerOrg.welcomeMessage || `Welcome to Motion Code via ${partnerOrg.name}`}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Your {partnerOrg.sport} organisation has partnered with Prepared to Play to bring you world-class movement education.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-heading text-5xl font-bold text-white leading-tight mb-6">
                Start your movement education journey.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Join thousands of athletes and coaches using evidence-based programs to move better and prevent injury.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-p2p-blue to-p2p-electric flex items-center justify-center">
            <span className="text-white text-xs font-bold">P2P</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Prepared to Play</p>
            <p className="text-gray-500 text-xs">Motion Code Platform</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoImage} alt="Prepared to Play" className="h-10 object-contain" />
          </div>

          {partnerOrg && (
            <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
              <Building2 className="w-4 h-4 shrink-0" style={{ color: partnerOrg.primaryColor }} />
              <span className="text-sm text-gray-300">
                Joining via <span className="font-semibold text-white">{partnerOrg.name}</span>
              </span>
            </div>
          )}

          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-gray-400">Free to join. No credit card required.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm font-medium">First name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Jane"
                            autoComplete="given-name"
                            autoFocus
                            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11"
                            data-testid="input-firstname"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm font-medium">Last name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Smith"
                            autoComplete="family-name"
                            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11"
                            data-testid="input-lastname"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm font-medium">Email address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11 pr-11"
                            data-testid="input-password"
                            onChange={(e) => {
                              field.onChange(e);
                              setPasswordValue(e.target.value);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      {passwordValue && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  i <= strength.score ? strength.color : "bg-gray-700"
                                }`}
                              />
                            ))}
                          </div>
                          {strength.label && (
                            <p className={`text-xs ${
                              strength.score <= 2 ? "text-red-400" :
                              strength.score === 3 ? "text-yellow-400" :
                              strength.score === 4 ? "text-blue-400" : "text-green-400"
                            }`}>
                              {strength.label} password
                            </p>
                          )}
                        </div>
                      )}
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                {/* Organisation code — only show if no org pre-filled */}
                {!orgParam && (
                  <FormField
                    control={form.control}
                    name="orgCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm font-medium">
                          Organisation code{" "}
                          <span className="text-gray-600 font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="e.g. NETBALL2026"
                              className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11 pr-10 uppercase"
                              data-testid="input-orgcode"
                              onBlur={(e) => {
                                field.onBlur();
                                validateOrgCode(e.target.value);
                              }}
                            />
                            {isValidatingCode && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                            )}
                            {partnerOrg && !isValidatingCode && (
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </FormControl>
                        {partnerOrg && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            <p className="text-xs text-green-400 font-medium">{partnerOrg.name} verified</p>
                          </div>
                        )}
                        {codeError && (
                          <p className="text-xs text-red-400 mt-1.5">{codeError}</p>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 text-white font-semibold transition-all mt-2 group"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                  ) : (
                    <><span>Create Account</span><ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <p className="text-gray-500 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-p2p-electric hover:text-blue-300 font-medium transition-colors"
                  data-testid="link-login"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
