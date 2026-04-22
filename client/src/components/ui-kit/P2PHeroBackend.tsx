import { motion } from "framer-motion";
import { BRAND } from "../../lib/brand";

export default function P2PHeroBackend() {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden rounded-2xl mb-8">
      <video
        src="/objects/Videos/Videos/Stepping - white belt/Lateral Jimmy Jumps.MP4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 flex flex-col items-center justify-center text-center text-white h-full"
      >
        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-2">
          {BRAND.name}
        </h2>
        <p className="text-lg text-gray-300">{BRAND.tagline}</p>
      </motion.div>
    </div>
  );
}
