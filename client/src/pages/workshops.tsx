import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WorkshopsPage() {
  const { user } = useAuth();
  const [showEarlyAccessDialog, setShowEarlyAccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const subject = encodeURIComponent("Masterclass Early Access Request");
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nOrganization: ${formData.organization}\n\nI'm interested in receiving early access notification for the Premium Masterclass Series.`
    );
    
    window.open(`mailto:ctandy@preparedtoplay.com.au?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: "Request Submitted!",
      description: "We'll notify you when the masterclass series launches.",
    });
    
    setShowEarlyAccessDialog(false);
    setFormData({ name: "", email: "", phone: "", organization: "" });
  };

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        {/* Hero Header */}
        <header className="bg-p2p-darker border-b border-p2p-border px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4">
              <Calendar className="w-8 h-8 md:w-10 md:h-10 text-p2p-electric" />
              <h1 className="font-heading text-3xl sm:text-4xl md:text-7xl font-bold text-white tracking-tight">
                Workshops
              </h1>
            </div>
            <p className="text-gray-300 font-body text-base md:text-xl max-w-4xl leading-relaxed">
              Join us for hands-on, in-person workshops designed to deepen your understanding of movement quality, 
              plyometric training, and athletic development. Learn directly from our expert coaches through practical, 
              evidence-based education.
            </p>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12">

          {/* Upcoming Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-7xl mb-16"
          >
            <div className="mb-8">
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Upcoming Courses
              </h2>
              <p className="text-gray-400 font-body text-sm md:text-lg">
                Secure your spot in our next workshop
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Featured Workshop Card */}
              <div className="bg-gradient-to-br from-p2p-dark to-p2p-darker border-2 border-p2p-electric/30 rounded-2xl md:rounded-3xl p-5 md:p-8 hover:border-p2p-electric/50 transition-all">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-p2p-electric/20 border border-p2p-electric/40 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-p2p-electric" />
                  <span className="text-p2p-electric font-semibold text-sm uppercase tracking-wide">Selling Fast</span>
                </div>
                
                <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-2 break-words">
                  Leg Power, Performance & ACL Prevention
                </h3>
                <p className="text-gray-400 font-body text-xs md:text-sm mb-6">
                  Master the teaching, training and testing of leg power, performance enhancement and ACL injury prevention for field and court sports.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 text-gray-300">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-p2p-electric mt-0.5 flex-shrink-0" />
                    <div className="font-body text-sm md:text-base">
                      <div>Saturday 4th October 2025</div>
                      <div className="text-xs md:text-sm text-gray-400">10:30am - 2:30pm</div>
                      <div className="mt-1">Saturday 11th October 2025</div>
                      <div className="text-xs md:text-sm text-gray-400">10:30am - 2:30pm</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-p2p-electric mt-0.5 flex-shrink-0" />
                    <span className="font-body text-sm md:text-base break-words">13-15 Puckle Street, Moonee Ponds VIC 3039</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-p2p-electric flex-shrink-0" />
                    <span className="font-body text-sm md:text-base">4 Hours Intensive</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-p2p-electric flex-shrink-0" />
                    <span className="font-body text-sm md:text-base">Limited to 30 Professionals</span>
                  </div>
                </div>

                <div className="bg-p2p-darker/50 border border-p2p-border rounded-xl p-4 mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-heading text-3xl font-bold text-white">$395</span>
                    <span className="text-gray-400 font-body text-sm">AUD</span>
                  </div>
                  <p className="text-gray-400 font-body text-sm">
                    Includes resource booklet, P2P test certification & refreshments
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold rounded-full"
                  data-testid="button-workshop-register"
                  onClick={() => window.open('mailto:ctandy@preparedtoplay.com.au?subject=Workshop%20Registration%20-%20Leg%20Power%20Performance%20ACL', '_blank')}
                >
                  Secure Your Spot
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Placeholder for Additional Workshops */}
              <div className="bg-p2p-dark/50 border-2 border-p2p-border/50 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <Calendar className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="font-heading text-xl font-bold text-gray-500 mb-2">
                  More Workshops Coming Soon
                </h3>
                <p className="text-gray-600 font-body">
                  Additional workshop dates will be announced soon. 
                  Register your interest to be notified first.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Past Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-7xl mb-16"
          >
            <div className="mb-8">
              <h2 className="font-heading text-4xl font-bold text-white mb-4 tracking-tight">
                Past Courses
              </h2>
              <p className="text-gray-400 font-body text-lg">
                Previous workshops and their impact
              </p>
            </div>

            <div className="bg-p2p-dark/50 border-2 border-p2p-border/50 border-dashed rounded-3xl p-12 text-center">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-gray-500 mb-2">
                Workshop Archive Coming Soon
              </h3>
              <p className="text-gray-600 font-body max-w-2xl mx-auto">
                Check back here to explore our previous workshops, attendee testimonials, and key learnings shared 
                with the S&C and physiotherapy community.
              </p>
            </div>
          </motion.div>

          {/* Future Masterclasses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-7xl"
          >
            <div className="bg-gradient-to-r from-p2p-blue/10 to-p2p-electric/10 rounded-3xl border border-p2p-electric/30 p-12">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-p2p-electric/20 border border-p2p-electric/40 rounded-full mb-6">
                  <Sparkles className="w-5 h-5 text-p2p-electric" />
                  <span className="text-p2p-electric font-semibold text-sm uppercase tracking-wide">Coming Soon</span>
                </div>
                
                <h2 className="font-heading text-4xl font-bold text-white mb-4 tracking-tight">
                  Premium Masterclass Series
                </h2>
                <p className="text-gray-300 font-body text-lg mb-6 leading-relaxed">
                  Get ready for our upcoming subscription-based masterclass series featuring advanced educational content, 
                  exclusive live sessions, and continuous professional development opportunities.
                </p>
                
                <div className="bg-p2p-dark/50 rounded-2xl border border-p2p-border p-6 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-heading text-4xl font-bold text-white">$15</span>
                    <span className="text-gray-400 font-body">USD / month</span>
                  </div>
                  <p className="text-gray-400 font-body text-sm">
                    Access to monthly masterclasses, exclusive content library, and direct Q&A sessions
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-p2p-electric/20 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-p2p-electric rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold font-body mb-1">Monthly Live Masterclasses</h4>
                      <p className="text-gray-400 font-body text-sm">Deep-dive sessions on advanced training concepts and methodologies</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-p2p-electric/20 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-p2p-electric rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold font-body mb-1">Exclusive Content Library</h4>
                      <p className="text-gray-400 font-body text-sm">On-demand access to recorded sessions and supplementary materials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-p2p-electric/20 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-p2p-electric rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold font-body mb-1">Direct Expert Access</h4>
                      <p className="text-gray-400 font-body text-sm">Q&A sessions and personalized guidance from our coaching team</p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold rounded-full px-8"
                  data-testid="button-masterclass-notify"
                  onClick={() => setShowEarlyAccessDialog(true)}
                >
                  Get Early Access Notification
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Early Access Dialog */}
      <Dialog open={showEarlyAccessDialog} onOpenChange={setShowEarlyAccessDialog}>
        <DialogContent className="sm:max-w-[500px] bg-p2p-darker border-2 border-p2p-electric/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading text-white">Get Early Access</DialogTitle>
            <DialogDescription className="text-gray-400 font-body">
              Be the first to know when our Premium Masterclass Series launches. We'll notify you with exclusive early access details.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-body">Name *</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-p2p-dark border-p2p-border text-white focus:border-p2p-electric"
                placeholder="Your full name"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-body">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-p2p-dark border-p2p-border text-white focus:border-p2p-electric"
                placeholder="your.email@example.com"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white font-body">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-p2p-dark border-p2p-border text-white focus:border-p2p-electric"
                placeholder="+61 xxx xxx xxx"
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="text-white font-body">Organization (Optional)</Label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="bg-p2p-dark border-p2p-border text-white focus:border-p2p-electric"
                placeholder="Your clinic or team name"
                data-testid="input-organization"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEarlyAccessDialog(false)}
                className="flex-1 border-p2p-border text-gray-300 hover:bg-p2p-dark"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold"
                data-testid="button-submit-early-access"
              >
                Submit Request
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
