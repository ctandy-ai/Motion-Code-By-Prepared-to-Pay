import { motion } from "framer-motion";
import PhoneFrame from "./PhoneFrame";
import VideoBackground from "./VideoBackground";
import AppMockup from "./AppMockup";

interface SectionProps {
  title: string;
  description: string;
  video: string;
  reverse?: boolean;
  showPhoneFrame?: boolean;
}

export default function MovementSection({ title, description, video, reverse, showPhoneFrame }: SectionProps) {
  const videoElement = showPhoneFrame ? (
    <AppMockup 
      video={video}
      exerciseTitle={title === "Acceleration (Starting)" ? "Standing Triple Jump" : title === "Change of Direction (Stepping)" ? "Lateral Jimmy Jumps" : title}
      category={title}
    />
  ) : (
    <VideoBackground 
      src={video}
      className="w-full h-full object-cover rounded-2xl shadow-glow"
    />
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`grid md:grid-cols-2 gap-8 md:gap-10 items-center py-12 md:py-24 px-4 md:px-20 ${
        reverse ? "md:grid-flow-dense" : ""
      }`}
    >
      <div className={`${reverse ? "md:col-start-2" : ""} flex justify-center`}>
        {showPhoneFrame ? (
          <PhoneFrame>
            {videoElement}
          </PhoneFrame>
        ) : (
          videoElement
        )}
      </div>
      <div className={reverse ? "md:col-start-1 md:row-start-1" : ""}>
        <h2 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight tracking-tight">
          {title}
        </h2>
        <p className="font-body text-gray-300 text-base sm:text-lg md:text-2xl leading-relaxed mb-6 md:mb-8 font-light">{description}</p>
        <a
          href="https://buy.stripe.com/00w8wRdrl9mD7Bvgqw6g800"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3.5 md:px-10 md:py-5 rounded-full bg-gradient-to-r from-p2p-blue to-p2p-electric font-body text-white text-base md:text-xl font-semibold shadow-2xl hover:shadow-p2p-electric/60 transition-all duration-300 hover:scale-105 uppercase tracking-wide"
          data-testid={`button-cta-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Get Access
        </a>
      </div>
    </motion.section>
  );
}
