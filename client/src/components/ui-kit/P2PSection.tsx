import { motion } from "framer-motion";

export default function P2PSection({
  title,
  text,
  video,
}: {
  title: string;
  text: string;
  video: string;
}) {
  return (
    <section className="flex flex-col md:flex-row items-center gap-6 md:gap-12 max-w-6xl mx-auto py-16 px-6 border-b border-gray-800">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="flex-1"
      >
        <h3 className="text-3xl font-heading text-blue-600 mb-3">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{text}</p>
      </motion.div>
      <motion.video
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        src={video}
        autoPlay
        loop
        muted
        playsInline
        className="rounded-xl shadow-2xl w-full md:w-1/2 object-cover"
      />
    </section>
  );
}
