import { useState } from "react";
import { Play } from "lucide-react";

interface VideoSmartProps {
  src?: string;
  poster?: string;
  className?: string;
}

export default function VideoSmart({ src, poster, className = "" }: VideoSmartProps) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`bg-gradient-to-br from-p2p-blue/20 to-p2p-electric/20 flex items-center justify-center ${className}`}>
        <Play className="w-12 h-12 text-gray-400 opacity-50" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!playing && poster && (
        <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => setPlaying(true)}>
          <img src={poster} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Play className="w-16 h-16 text-white drop-shadow-lg" />
          </div>
        </div>
      )}
      <video 
        src={src}
        poster={poster}
        controls={playing}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        onClick={() => setPlaying(true)}
        data-testid="video-smart"
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/quicktime" />
      </video>
    </div>
  );
}
