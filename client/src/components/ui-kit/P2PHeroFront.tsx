import { motion } from "framer-motion";
import { BRAND } from "../../lib/brand";

export default function P2PHeroFront() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center bg-black">
      <video
        src="/objects/Videos/Videos/Sprinting - blue belt/Jimmy Jumps_.MOV"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 text-center text-white max-w-3xl px-4"
      >
        <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4">
          {BRAND.name}
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-8">
          {BRAND.tagline}
        </p>
        <a
          href="/exercises"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
          data-testid="button-access-motion-code"
        >
          Access Motion Code
        </a>
      </motion.div>
    </section>
  );
}
