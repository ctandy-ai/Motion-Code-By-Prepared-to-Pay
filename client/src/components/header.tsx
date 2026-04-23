import { Activity, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import preparedToPlayLogo from "@/assets/p2p-logo-white.svg";

export default function Header() {
  return (
    <header className="bg-p2p-dark/95 backdrop-blur-lg shadow-lg border-b border-p2p-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/5 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/10">
                <img 
                  src={preparedToPlayLogo} 
                  alt="Prepared to Play" 
                  className="h-14 w-auto"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-heading bg-gradient-to-r from-p2p-blue to-p2p-electric bg-clip-text text-transparent leading-tight">Motion Code</h1>
                <span className="text-xs font-body text-gray-400 leading-tight">by Prepared to Play</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <span className="text-sm font-body text-gray-300">Leg Power for Running Performance & Injury Prevention</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="hover:bg-p2p-surface rounded-xl">
              <User className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-p2p-surface rounded-xl">
              <Settings className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
