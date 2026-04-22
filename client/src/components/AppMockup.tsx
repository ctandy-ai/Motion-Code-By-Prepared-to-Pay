import { Play, Search, Star } from "lucide-react";
import VideoBackground from "./VideoBackground";

interface AppMockupProps {
  video: string;
  exerciseTitle: string;
  category: string;
}

export default function AppMockup({ video, exerciseTitle, category }: AppMockupProps) {
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* App Header */}
      <div className="bg-gradient-to-r from-p2p-blue to-p2p-electric px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white/20 rounded"></div>
          <span className="text-white font-semibold text-sm">Motion Code</span>
        </div>
        <div className="flex items-center space-x-3">
          <Search className="w-4 h-4 text-white/80" />
          <div className="w-6 h-6 bg-white/20 rounded-full"></div>
        </div>
      </div>

      {/* Category Badge */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <span className="inline-block px-3 py-1 bg-blue-100 text-p2p-blue text-xs font-medium rounded-full">
          {category}
        </span>
      </div>

      {/* Main Exercise View */}
      <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
            <VideoBackground 
              src={video}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <Play className="w-3 h-3" />
              <span>0:15</span>
            </div>
          </div>

          {/* Exercise Info */}
          <div className="p-3 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{exerciseTitle}</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
              <span className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                Black Belt
              </span>
              <span>•</span>
              <span>2-3 sets</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              Develop explosive power and reactive strength through multi-directional plyometric movement patterns.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="px-3 pb-3 flex gap-2">
            <button className="flex-1 bg-gradient-to-r from-p2p-blue to-p2p-electric text-white text-xs font-medium py-2 rounded-lg">
              Assign to Athlete
            </button>
            <button className="px-4 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg">
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex justify-around items-center">
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 bg-p2p-blue/20 rounded-sm mb-1"></div>
          <span className="text-[10px] text-p2p-blue font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 bg-gray-300 rounded-sm mb-1"></div>
          <span className="text-[10px] text-gray-500">Library</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 bg-gray-300 rounded-sm mb-1"></div>
          <span className="text-[10px] text-gray-500">Athletes</span>
        </div>
      </div>
    </div>
  );
}
