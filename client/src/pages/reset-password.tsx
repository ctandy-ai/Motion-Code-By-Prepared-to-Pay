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
import { useLocation } from "wouter";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import logoImage from "@/assets/p2p-logo-white.svg";

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

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

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    if (!tokenFromUrl) {
      setTokenError("No reset token found. Please request a new reset link.");
    } else {
      setToken(tokenFromUrl);
    }
  }, []);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const strength = getPasswordStrength(passwordValue);

  async function onSubmit(data: ResetPasswordForm) {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }

      setResetSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("expired") || error.message?.toLowerCase().includes("invalid")) {
        setTokenError(error.message);
      } else {
        toast({
          title: "Reset failed",
          description: error.message || "Could not reset your password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <img src={logoImage} alt="Prepared to Play" className="h-10 object-contain" />
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-red-900/40 rounded-2xl p-10 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-3">
              Link expired or invalid
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {tokenError}
            </p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full h-11 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 font-semibold"
              data-testid="button-request-new-link"
            >
              Get a new reset link
            </Button>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <img src={logoImage} alt="Prepared to Play" className="h-10 object-contain" />
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-2xl p-10 backdrop-blur-sm">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-3">
              Password updated
            </h1>
            <p className="text-gray-400 mb-8">
              Your password has been changed. Taking you to sign in...
            </p>
            <div className="flex justify-center mb-6">
              <Loader2 className="w-5 h-5 text-p2p-electric animate-spin" />
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-11 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 font-semibold"
              data-testid="button-go-to-login"
            >
              Sign in now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-p2p-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logoImage} alt="Prepared to Play" className="h-10 object-contain" />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-p2p-electric/10 border border-p2p-electric/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-p2p-electric" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white">
              Set new password
            </h1>
          </div>
          <p className="text-gray-400 ml-11">Choose a strong password to secure your account.</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm font-medium">New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          autoFocus
                          autoComplete="new-password"
                          className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11 pr-11"
                          data-testid="input-new-password"
                          onChange={(e) => {
                            field.onChange(e);
                            setPasswordValue(e.target.value);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    {/* Strength bar */}
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm font-medium">Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your new password"
                          autoComplete="new-password"
                          className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11 pr-11"
                          data-testid="input-confirm-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 text-white font-semibold transition-all group"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating password...</>
                  ) : (
                    <><span>Update Password</span><ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-5 pt-5 border-t border-gray-800">
            <ul className="space-y-1.5">
              {[
                { text: "At least 8 characters", met: passwordValue.length >= 8 },
                { text: "One uppercase letter", met: /[A-Z]/.test(passwordValue) },
                { text: "One number", met: /[0-9]/.test(passwordValue) },
              ].map((req) => (
                <li key={req.text} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-3.5 h-3.5 transition-colors ${req.met ? "text-green-400" : "text-gray-600"}`} />
                  <span className={req.met ? "text-gray-300" : "text-gray-600"}>{req.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
