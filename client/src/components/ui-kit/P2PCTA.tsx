import { motion } from "framer-motion";
import { BRAND } from "../../lib/brand";

export default function P2PCTA() {
  return (
    <section className="py-20 text-center bg-gray-900 border-t border-gray-800">
      <motion.h4
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-3xl font-heading text-white mb-4"
      >
        Ready to Build Movement Mastery?
      </motion.h4>
      <p className="text-gray-400 mb-8">
        Join the Motion Code platform and train the qualities that define running performance.
      </p>
      <a
        href="/exercises"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
        data-testid="button-cta-access"
      >
        Access Motion Code
      </a>
    </section>
  );
}
