import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Activity, 
  CheckCircle2,
  Sparkles,
  Zap
} from "lucide-react";

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organization: z.string().optional(),
  role: z.string().min(1, "Please select your role"),
});

type WaitlistForm = z.infer<typeof waitlistSchema>;

export default function MotionCodePro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      organization: "",
      role: "",
    },
  });

  async function onSubmit(data: WaitlistForm) {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/pro-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to join waitlist");
      }
      
      setSubmitted(true);
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Motion Code Pro launches.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const features = [
    {
      icon: Users,
      title: "Athlete Management",
      description: "Comprehensive athlete profiles, team organization, and progress tracking in one platform"
    },
    {
      icon: Calendar,
      title: "Program Scheduling",
      description: "Create, assign, and track training programs across multiple athletes and teams"
    },
    {
      icon: Activity,
      title: "Performance Monitoring",
      description: "Track workout completion, exercise logs, and athlete progress over time"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Visualize trends, identify patterns, and make data-driven programming decisions"
    },
    {
      icon: FileText,
      title: "Session Plans",
      description: "Build detailed session plans with exercise prescriptions, coaching cues, and progressions"
    },
    {
      icon: Zap,
      title: "Seamless Integration",
      description: "Access Motion Code's exercise library and education content directly in your athlete management workflow"
    }
  ];

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user || undefined} />
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-p2p-blue/20 via-p2p-dark to-p2p-dark border-b border-p2p-blue/20">
          <div className="absolute inset-0 bg-gradient-to-br from-p2p-blue/5 via-transparent to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-p2p-blue/20 border border-p2p-blue/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-p2p-electric" />
              <span className="text-sm font-semibold text-p2p-electric uppercase tracking-wider">Coming Soon</span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Motion Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-p2p-blue to-p2p-electric">Pro</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl leading-relaxed">
              The all-inclusive athlete management system built for professional S&C coaches and physiotherapists.
              Seamlessly manage athletes, programs, and performance tracking.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 text-center">
              Everything You Need to Manage Athletes
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Motion Code Pro combines powerful athlete management with the movement education platform you already know.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gradient-to-br from-gray-900 to-black border-gray-800 hover:border-p2p-blue/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-p2p-blue/20 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-p2p-electric" />
                    </div>
                    <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Waitlist Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-900 to-black border-p2p-blue/30 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  Join the Waitlist
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Be among the first to access Motion Code Pro when it launches. We'll keep you updated on development progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                    <p className="text-gray-400 mb-6">
                      We'll send you an email at <span className="text-white font-medium">{form.getValues('email')}</span> when Motion Code Pro is ready.
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        form.reset();
                      }}
                      variant="outline"
                      className="border-gray-700 hover:bg-gray-800"
                      data-testid="button-add-another"
                    >
                      Add Another Person
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">First Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="John"
                                  className="bg-gray-900/50 border-gray-700 text-white"
                                  data-testid="input-first-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Smith"
                                  className="bg-gray-900/50 border-gray-700 text-white"
                                  data-testid="input-last-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="you@example.com"
                                className="bg-gray-900/50 border-gray-700 text-white"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Organization (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Your clinic or team name"
                                className="bg-gray-900/50 border-gray-700 text-white"
                                data-testid="input-organization"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Your Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="coach">S&C Coach</SelectItem>
                                <SelectItem value="physio">Physiotherapist</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 text-white font-semibold uppercase py-6 text-lg"
                        data-testid="button-join-waitlist"
                      >
                        {isSubmitting ? "Joining..." : "Join the Waitlist"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
