import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function Education() {
  const { user } = useAuth();

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
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-p2p-electric" />
              <h1 className="font-heading text-3xl sm:text-4xl md:text-7xl font-bold text-white tracking-tight">
                Education Hub
              </h1>
            </div>
            <p className="text-gray-300 font-body text-xl max-w-4xl leading-relaxed">
              Insights and research from our team to enhance your understanding of athletic development and running performance.
            </p>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12">

          {/* HMMR Media Articles Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-7xl"
          >
            <div className="mb-8">
              <h3 className="font-heading text-5xl font-bold text-white mb-4 tracking-tight">
                Featured Articles from HMMR Media
              </h3>
              <p className="text-gray-300 font-body text-lg leading-relaxed">
                Insights and research from our Co-Founder and Director, published on HMMR Media
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Revisiting Running Drills",
                  excerpt: "Understanding the distinction between drills and skills. Drills challenge posture and positions similar to the sprint action, serving as specific strength and functional flexibility development.",
                  url: "https://www.hmmrmedia.com/2024/09/revisiting-running-drills/",
                  date: "September 2024"
                },
                {
                  title: "A Structured Process to Improve Training Quality",
                  excerpt: "A systematic approach to enhancing the quality of training sessions and athlete development.",
                  url: "https://www.hmmrmedia.com/2024/05/training-quality/",
                  date: "May 2024"
                },
                {
                  title: "Rethinking Knee Injuries in Female Athletes",
                  excerpt: "New perspectives on ACL and knee injury prevention strategies for female athletes.",
                  url: "https://www.hmmrmedia.com/2024/02/rethinking-knee-injuries-in-female-athletes/",
                  date: "February 2024"
                },
                {
                  title: "How Runners Can Train in the Water",
                  excerpt: "Exploring aquatic training methods for runners to maintain fitness and reduce injury risk.",
                  url: "https://www.hmmrmedia.com/2023/02/how-runners-can-train-in-the-water/",
                  date: "February 2023"
                },
                {
                  title: "A Systems Approach to Calf Complex Injuries",
                  excerpt: "Comprehensive analysis of calf injuries using a systems-based methodology for prevention and rehabilitation.",
                  url: "https://www.hmmrmedia.com/2022/10/a-systems-approach-to-calf-complex-injuries/",
                  date: "October 2022"
                }
              ].map((article, index) => (
                <motion.a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="group"
                >
                  <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden h-full hover:border-p2p-electric/50 transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-orange-600/10 to-orange-400/10 border-b border-p2p-border">
                      <CardTitle className="text-white font-heading text-xl group-hover:text-p2p-electric transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400 font-body text-sm">
                        {article.date}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-gray-300 font-body text-sm mb-4 leading-relaxed">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-p2p-electric font-semibold text-sm">
                        Read on HMMR Media
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Continue Learning Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-16 max-w-7xl"
          >
            <div className="bg-gradient-to-r from-p2p-blue/10 to-p2p-electric/10 rounded-3xl border border-p2p-electric/20 p-12">
              <h3 className="font-heading text-4xl font-bold text-white mb-4 tracking-tight">
                Apply What You've Learned
              </h3>
              <p className="text-gray-300 font-body text-lg mb-6 max-w-3xl leading-relaxed">
                Explore our Movement Library to see these principles in action through our comprehensive exercise database, organized by movement quality and belt progression.
              </p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => window.location.href = "/exercises"}
                  className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold rounded-full px-8"
                  data-testid="button-view-exercises"
                >
                  Explore Movement Library
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
