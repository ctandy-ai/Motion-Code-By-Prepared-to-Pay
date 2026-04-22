import { useState } from "react";
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
import { ArrowLeft, Mail, Loader2, ArrowRight } from "lucide-react";
import logoImage from "@assets/download_1753006535107.png";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [noAccountFound, setNoAccountFound] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordForm) {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not process request");
      }

      setSubmittedEmail(data.email);

      if (result.resetLink) {
        // Known account — extract token and redirect directly to reset page
        try {
          const url = new URL(result.resetLink);
          const token = url.searchParams.get("token");
          if (token) {
            setEmailSubmitted(true);
            setTimeout(() => {
              navigate(`/reset-password?token=${encodeURIComponent(token)}`);
            }, 1500);
            return;
          }
        } catch {}
      }

      // No resetLink = email not registered — show neutral message (don't reveal account existence)
      setNoAccountFound(true);
      setEmailSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message || "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSubmitted) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <img src={logoImage} alt="Prepared to Play" className="h-10 object-contain" />
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-2xl p-10 backdrop-blur-sm">
            <div className="w-16 h-16 bg-p2p-electric/10 border border-p2p-electric/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-p2p-electric" />
            </div>

            {noAccountFound ? (
              <>
                <h1 className="font-heading text-2xl font-bold text-white mb-3">
                  Check your inbox
                </h1>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  If <span className="text-white font-medium">{submittedEmail}</span> is registered, you'll receive a reset link shortly.
                </p>
                <button
                  onClick={() => { setEmailSubmitted(false); setNoAccountFound(false); form.reset(); }}
                  className="text-sm text-p2p-electric hover:text-blue-300 transition-colors"
                >
                  Try a different email
                </button>
                <div className="mt-6 pt-5 border-t border-gray-800">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-heading text-2xl font-bold text-white mb-3">
                  Taking you to reset...
                </h1>
                <p className="text-gray-400 mb-2">
                  Verified <span className="text-white font-medium">{submittedEmail}</span>
                </p>
                <p className="text-gray-500 text-sm mb-8">
                  Redirecting you to set your new password now.
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-5 h-5 text-p2p-electric animate-spin" />
                </div>
              </>
            )}
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
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>

          <h1 className="font-heading text-3xl font-bold text-white mb-2">
            Reset your password
          </h1>
          <p className="text-gray-400">
            Enter your account email and we'll take you straight to the reset page.
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                        autoFocus
                        className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 text-white font-semibold transition-all group"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><span>Continue to Reset</span><ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              Remembered it?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-p2p-electric hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
