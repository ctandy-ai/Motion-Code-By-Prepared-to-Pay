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
import { apiRequest, clearAuthCache } from "@/lib/queryClient";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import logoImage from "/p2p-logo-white.svg";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useRoleRedirect();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginForm) {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/auth/login", data);
      const result = await res.json();

      if (result.success) {
        clearAuthCache();
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Incorrect email or password. Please try again.",
        variant: "destructive",
      });
      form.setFocus("password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-p2p-dark flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-p2p-darker via-p2p-dark to-black border-r border-p2p-border flex-col justify-between p-12">
        <div>
          <img src={logoImage} alt="Prepared to Play" className="h-12 object-contain" />
        </div>
        <div>
          <h2 className="font-heading text-5xl font-bold text-white leading-tight mb-6">
            Train smarter.<br />Move better.<br />Prevent injury.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            The athlete education platform built for National Sporting Organisations — 
            delivering evidence-based ACL prevention and movement quality programs at scale.
          </p>
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
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoImage} alt="Prepared to Play" className="h-10 object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-400">Sign in to your Motion Code account</p>
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1.5">
                        <FormLabel className="text-gray-300 text-sm font-medium">Password</FormLabel>
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-xs text-p2p-electric hover:text-blue-300 transition-colors"
                          data-testid="link-forgot-password"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-p2p-electric focus:ring-1 focus:ring-p2p-electric/30 transition-all h-11 pr-11"
                            data-testid="input-password"
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
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 text-white font-semibold transition-all mt-2 group"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                  ) : (
                    <><span>Sign In</span><ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-p2p-electric hover:text-blue-300 font-medium transition-colors"
                  data-testid="link-signup"
                >
                  Create one free
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
