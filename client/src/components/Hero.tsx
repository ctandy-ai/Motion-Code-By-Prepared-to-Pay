import { motion } from "framer-motion";
import preparedToPlayLogo from "@assets/Logo (2)_1754315444562.png";
import { Instagram, Facebook, Twitter } from "lucide-react";
import VideoBackground from "./VideoBackground";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center bg-p2p-dark">
      <VideoBackground 
        src="/objects/Videos/Videos/Sprinting - blue belt/Jimmy Jumps_.MOV"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
      
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 bg-p2p-dark/80 backdrop-blur-md border-b border-p2p-border z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/preparedtoplay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-p2p-electric transition"
              aria-label="Instagram"
              data-testid="link-instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/preparedtoplay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-p2p-electric transition"
              aria-label="Facebook"
              data-testid="link-facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/preparedtoplay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-p2p-electric transition"
              aria-label="Twitter"
              data-testid="link-twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
          <a
            href="/login"
            className="px-6 py-2 rounded-2xl bg-gradient-to-r from-p2p-blue to-p2p-electric font-body text-white text-sm shadow-glow hover:shadow-blue-500/50 transition"
            data-testid="button-nav-login"
          >
            Sign In / Access Platform
          </a>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="relative text-center text-white px-4 max-w-5xl mx-auto"
      >
        {/* Centralized P2P Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-3xl border border-white/20">
            <img 
              src={preparedToPlayLogo} 
              alt="Prepared to Play" 
              className="h-20 md:h-28 w-auto"
            />
          </div>
        </motion.div>

        {/* Headline with Professional Container */}
        <div className="relative inline-block mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-p2p-blue/20 via-p2p-electric/20 to-p2p-blue/20 blur-2xl rounded-3xl" />
          <div className="relative bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md border border-p2p-electric/30 rounded-3xl px-12 py-8">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-8xl font-bold text-white leading-tight tracking-tight">
              Motion Code
            </h1>
          </div>
        </div>
        <p className="text-lg sm:text-2xl md:text-4xl font-body mb-8 md:mb-12 font-light tracking-wide text-white/95 max-w-4xl mx-auto">
          Built for Movement Mastery
        </p>
        <a
          href="https://buy.stripe.com/00w8wRdrl9mD7Bvgqw6g800"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-4 md:px-10 md:py-5 rounded-full bg-gradient-to-r from-p2p-blue to-p2p-electric font-body text-white text-lg md:text-xl font-semibold shadow-2xl hover:shadow-p2p-electric/60 transition-all duration-300 hover:scale-105 uppercase tracking-wide"
          data-testid="button-hero-cta"
        >
          Get Access
        </a>
      </motion.div>
    </section>
  );
}
