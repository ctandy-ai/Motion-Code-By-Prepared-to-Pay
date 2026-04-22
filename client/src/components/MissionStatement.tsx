import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function MissionStatement() {
  return (
    <section className="relative py-32 px-6 md:px-20 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-p2p-blue/10 via-p2p-dark to-black" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-p2p-blue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-p2p-electric/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-p2p-blue to-p2p-electric p-4 rounded-2xl shadow-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            Built for True Movement Mastery
          </h2>

          {/* Main Statement */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-p2p-blue/10 via-p2p-electric/10 to-p2p-blue/10 blur-2xl" />
            <p className="relative font-body text-gray-200 text-2xl md:text-3xl leading-relaxed font-light max-w-3xl mx-auto">
              Motion Code is a performance system built for coaches and clinicians who want to{" "}
              <span className="text-white font-semibold">truly understand and perfect movement</span>{" "}
              with their athletes and clients, not just program it. It transforms how you see running by distilling the qualities of{" "}
              <span className="text-p2p-electric font-semibold">acceleration, deceleration, change of direction and sprinting</span>{" "}
              to build resilience.
            </p>
          </div>

          {/* Decorative Line */}
          <div className="mt-12 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-p2p-electric to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
