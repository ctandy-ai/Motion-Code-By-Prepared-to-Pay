import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTier } from "@/hooks/useTier";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Bell, Shield, Eye, EyeOff, CreditCard, Zap, Star, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function BillingSection() {
  const { billing, tier, effectiveTier, trialActive, trialDaysLeft } = useTier();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/portal") as any;
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
      else toast({ title: "Portal unavailable", description: data.error || "Please contact support" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  }

  const tierLabels: Record<string, { label: string; icon: any; color: string }> = {
    starter: { label: "Free Starter", icon: Shield, color: "text-[#6A8499]" },
    trial: { label: "Trial", icon: Zap, color: "text-amber-400" },
    nso_granted: { label: "NSO Member", icon: CheckCircle, color: "text-green-400" },
    season_pass: { label: "Season Pass", icon: Zap, color: "text-[#FF6432]" },
    pro: { label: "Pro", icon: Star, color: "text-amber-400" },
  };

  const tierInfo = tierLabels[tier] || tierLabels.starter;
  const TierIcon = tierInfo.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-p2p-blue/10 to-p2p-electric/10 border-b border-p2p-border">
          <CardTitle className="flex items-center gap-3 text-white font-heading text-2xl">
            <CreditCard className="w-6 h-6 text-p2p-electric" />
            Subscription & Billing
          </CardTitle>
          <CardDescription className="text-gray-400 font-body">
            Manage your plan and payment details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Current plan */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-p2p-dark border border-p2p-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A2D3F] flex items-center justify-center">
                <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />
              </div>
              <div>
                <p className="text-white font-semibold">{tierInfo.label}</p>
                <p className="text-gray-400 text-sm">
                  {trialActive
                    ? `Trial active — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining`
                    : tier === "nso_granted"
                    ? "NSO organisation access — no payment required"
                    : tier === "starter"
                    ? "Free plan"
                    : billing?.currentPeriodEnd
                    ? `Renews ${new Date(billing.currentPeriodEnd).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Active subscription"}
                </p>
              </div>
            </div>
            <Badge className={`${tier === "pro" ? "bg-amber-500/10 text-amber-400 border-amber-400/30" : tier === "season_pass" ? "bg-[#FF6432]/10 text-[#FF6432] border-[#FF6432]/30" : "bg-[#1A2D3F] text-gray-400 border-gray-600/30"}`}>
              {tierInfo.label}
            </Badge>
          </div>

          {/* Trial warning */}
          {trialActive && trialDaysLeft <= 3 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm">
                Your trial expires in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}. Upgrade to keep your Movement Blueprint and all content.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {(tier === "starter" || trialActive) && (
              <a href="/pricing" className="flex-1">
                <Button className="w-full bg-[#FF6432] hover:bg-[#FF7A52] text-white font-bold uppercase tracking-wide">
                  <Zap className="w-4 h-4 mr-2" />
                  {trialActive ? "Upgrade Before Trial Ends" : "View Plans"}
                </Button>
              </a>
            )}
            {(tier === "season_pass" || tier === "pro") && (
              <Button
                variant="outline"
                className="border-p2p-border text-gray-300 hover:text-white"
                onClick={openPortal}
                disabled={portalLoading}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {portalLoading ? "Opening..." : "Manage Billing"}
              </Button>
            )}
          </div>

          {billing?.cancelAtPeriodEnd && (
            <p className="text-amber-400 text-sm text-center">
              ⚠ Subscription set to cancel at end of period. Reactivate in Manage Billing.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PUT", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  function onProfileSubmit(data: ProfileForm) {
    updateProfileMutation.mutate(data);
  }

  function onPasswordSubmit(data: PasswordForm) {
    changePasswordMutation.mutate(data);
  }

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-p2p-darker border-b border-p2p-border px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <Settings className="w-8 h-8 text-p2p-electric" />
              <h1 className="font-heading text-5xl font-bold text-white tracking-tight">Settings</h1>
            </div>
            <p className="text-gray-400 font-body mt-2 text-lg">Manage your account and preferences</p>
          </motion.div>
        </header>

        <main className="flex-1 p-8">
          <div className="max-w-4xl space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-p2p-blue/10 to-p2p-electric/10 border-b border-p2p-border">
                  <CardTitle className="flex items-center gap-3 text-white font-heading text-2xl">
                    <User className="w-6 h-6 text-p2p-electric" />
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-body">
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 font-body">First Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter first name"
                                  className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                                  data-testid="input-first-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 font-body">Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter last name"
                                  className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                                  data-testid="input-last-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 font-body">Email Address</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter email"
                                className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold rounded-full px-8 py-2"
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600/10 to-purple-400/10 border-b border-p2p-border">
                  <CardTitle className="flex items-center gap-3 text-white font-heading text-2xl">
                    <Bell className="w-6 h-6 text-purple-400" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-body">
                    Configure your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-400 font-body">Notification settings coming soon...</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-600/10 to-green-400/10 border-b border-p2p-border">
                  <CardTitle className="flex items-center gap-3 text-white font-heading text-2xl">
                    <Shield className="w-6 h-6 text-green-400" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-gray-400 font-body">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 font-body">Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showCurrentPassword ? "text" : "password"}
                                  placeholder="Enter current password"
                                  className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500 pr-10"
                                  data-testid="input-current-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                  data-testid="button-toggle-current-password"
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 font-body">New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Enter new password (min 8 characters)"
                                  className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500 pr-10"
                                  data-testid="input-new-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                                  data-testid="button-toggle-new-password"
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 font-body">Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm new password"
                                  className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500 pr-10"
                                  data-testid="input-confirm-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                  data-testid="button-toggle-confirm-password"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:shadow-glow text-white font-semibold rounded-full px-8 py-2"
                        data-testid="button-change-password"
                      >
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
            <BillingSection />
          </div>
        </main>
      </div>
    </div>
  );
}