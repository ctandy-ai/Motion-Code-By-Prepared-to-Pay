import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Book, MessageCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function HelpPage() {
  const { user } = useAuth();

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
              <HelpCircle className="w-8 h-8 text-p2p-electric" />
              <h1 className="font-heading text-5xl font-bold text-white tracking-tight">Help & Support</h1>
            </div>
            <p className="text-gray-400 font-body mt-2 text-lg">Get help and find answers to common questions</p>
          </motion.div>
        </header>

        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden hover:border-p2p-electric/50 transition-all">
                  <CardHeader className="bg-gradient-to-r from-blue-600/10 to-blue-400/10 border-b border-p2p-border">
                    <CardTitle className="flex items-center gap-2 text-white font-heading text-xl">
                      <Book className="w-5 h-5 text-blue-400" />
                      Documentation
                    </CardTitle>
                    <CardDescription className="text-gray-400 font-body">
                      Learn how to use Motion Code effectively
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-300 font-body">Access comprehensive guides and tutorials</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden hover:border-p2p-electric/50 transition-all">
                  <CardHeader className="bg-gradient-to-r from-green-600/10 to-green-400/10 border-b border-p2p-border">
                    <CardTitle className="flex items-center gap-2 text-white font-heading text-xl">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                      Community
                    </CardTitle>
                    <CardDescription className="text-gray-400 font-body">
                      Connect with other professionals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-300 font-body">Join discussions and share insights</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden hover:border-p2p-electric/50 transition-all">
                  <CardHeader className="bg-gradient-to-r from-purple-600/10 to-purple-400/10 border-b border-p2p-border">
                    <CardTitle className="flex items-center gap-2 text-white font-heading text-xl">
                      <Mail className="w-5 h-5 text-purple-400" />
                      Contact Support
                    </CardTitle>
                    <CardDescription className="text-gray-400 font-body">
                      Get direct help from our team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-300 font-body">Email us for personalized assistance</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}