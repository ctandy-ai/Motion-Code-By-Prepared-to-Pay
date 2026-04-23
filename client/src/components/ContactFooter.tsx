import { Mail, Phone, MapPin } from "lucide-react";
import preparedToPlayLogo from "@/assets/p2p-logo-white.svg";

export default function ContactFooter() {
  return (
    <footer className="bg-black/40 border-t border-p2p-border py-16 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <img 
              src={preparedToPlayLogo} 
              alt="Prepared to Play" 
              className="h-16 w-auto mb-4"
            />
            <p className="font-body text-gray-400 text-sm leading-relaxed">
              Motion Code by Prepared to Play — Professional movement education for coaches and physiotherapists.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-2xl font-bold text-white mb-6">Contact Us</h3>
            <div className="space-y-3">
              <a 
                href="mailto:info@preparedtoplay.com" 
                className="flex items-center gap-3 text-gray-400 hover:text-p2p-electric transition"
              >
                <Mail className="w-4 h-4" />
                <span className="font-body text-sm">info@preparedtoplay.com</span>
              </a>
              <a 
                href="tel:+61423538819" 
                className="flex items-center gap-3 text-gray-400 hover:text-p2p-electric transition"
              >
                <Phone className="w-4 h-4" />
                <span className="font-body text-sm">0423 538 819</span>
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="font-body text-sm">Melbourne VIC Australia, Prepared to Play HQ</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-heading text-2xl font-bold text-white mb-6">Get Started</h3>
            <a
              href="https://buy.stripe.com/00w8wRdrl9mD7Bvgqw6g800"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-p2p-blue to-p2p-electric font-body text-white text-lg font-semibold shadow-2xl hover:shadow-p2p-electric/60 transition-all duration-300 hover:scale-105 uppercase tracking-wide mb-4"
              data-testid="button-footer-cta"
            >
              Get Access
            </a>
            <p className="font-body text-gray-300 text-sm font-bold">
              Join 100+ coaches and clinicians who are levelling up and building real skills not just knowledge.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-p2p-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-gray-400 text-sm">
            © {new Date().getFullYear()} Prepared to Play — Motion Code. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-body text-gray-400">
            <a href="#" className="hover:text-p2p-electric transition">Privacy Policy</a>
            <a href="#" className="hover:text-p2p-electric transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
