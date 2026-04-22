import { motion } from "framer-motion";
import groundContactImg from "@assets/ground contact time_1760010709947.jpg";
import sprintingImg from "@assets/sprinting_1760010814329.jpg";
import codImg from "@assets/change of direction_1760010709946.jpg";
import decelerationImg from "@assets/acceleration_1760010709946.jpg";

export default function StatisticsSection() {
  const stats = [
    {
      image: groundContactImg,
      value: "0.08–0.25 s",
      label: "Ground Contact Time",
      description: "Where reactive strength decides every play",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      image: sprintingImg,
      value: "5-6× BW",
      label: "Force During Sprinting",
      description: "Maximal output in microseconds",
      gradient: "from-p2p-blue to-blue-400"
    },
    {
      image: codImg,
      value: "3–4× Body Weight",
      label: "Change-of-Direction Load",
      description: "Every step, cut, or pivot",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      image: decelerationImg,
      value: "6× BW",
      label: "Deceleration Impact",
      description: "The highest force demand in sport",
      gradient: "from-p2p-electric to-cyan-400"
    }
  ];

  return (
    <section className="relative py-32 px-6 md:px-20 overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-p2p-blue/5 via-transparent to-p2p-electric/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-p2p-blue/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-p2p-blue/20 to-p2p-electric/20 border border-p2p-electric/30 rounded-full text-p2p-electric text-sm font-semibold tracking-wide uppercase">
              The Science
            </span>
          </div>
          <h2 className="font-heading text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            The Gap Between Training & Reality
          </h2>
          <div className="font-body text-gray-300 text-xl md:text-2xl max-w-4xl mx-auto font-light leading-relaxed space-y-6">
            <p>
              Most preparation happens in the gym — building max strength and mechanical power.
            </p>
            <p className="font-semibold text-white">
              But the game isn't won there.
            </p>
            <p>
              On the field and court, performance lives in the <span className="text-p2p-electric font-bold">elastic, reactive spectrum</span> — 
              where ground contact times are measured in milliseconds, not seconds.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
                data-testid={`stat-card-${index}`}
              >
                {/* Glow Effect on Hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-30 blur transition duration-500`} />
                
                {/* Card */}
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300 h-full">
                  {/* Image */}
                  <div className="relative w-full h-32 mb-6 rounded-xl overflow-hidden">
                    <img 
                      src={stat.image} 
                      alt={stat.label}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20`} />
                  </div>
                  
                  {/* Value */}
                  <div className="font-heading text-5xl font-bold text-white mb-3 tracking-tight">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className="font-heading text-lg font-bold text-p2p-electric mb-4">
                    {stat.label}
                  </div>
                  
                  {/* Description */}
                  <p className="font-body text-gray-400 text-sm leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-p2p-blue via-p2p-electric to-p2p-blue rounded-3xl blur opacity-30" />
            <div className="relative bg-gradient-to-r from-p2p-blue/10 to-p2p-electric/10 border border-p2p-electric/40 rounded-3xl px-10 py-8 backdrop-blur-sm">
              <p className="font-body text-gray-200 text-xl md:text-2xl font-light max-w-4xl space-y-2">
                <span className="block">Most Athletes never train here.</span>
                <span className="block bg-gradient-to-r from-p2p-blue to-p2p-electric bg-clip-text text-transparent font-bold text-3xl">Motion Code does.</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
