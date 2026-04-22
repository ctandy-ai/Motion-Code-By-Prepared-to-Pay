import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

interface VideoBackgroundProps {
  src: string;
  className?: string;
}

export default function VideoBackground({ src, className = "" }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      // Try to play, but handle failure with user interaction fallback
      video.play().catch(() => {
        // Autoplay blocked - show play button for user interaction
        setPlayFailed(true);
      });
    };

    video.addEventListener('canplay', handleCanPlay);
    
    // If already loaded, trigger immediately
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [src]);

  const handleUserPlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        setPlayFailed(false);
      }).catch((err) => {
        console.error("Play failed:", err);
      });
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={className}
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        style={{ willChange: 'transform' }}
        crossOrigin="anonymous"
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/quicktime" />
      </video>
      
      {playFailed && (
        <button
          onClick={handleUserPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity hover:bg-black/60 cursor-pointer z-10"
          aria-label="Play background video"
          data-testid="button-play-background"
        >
          <div className="bg-p2p-blue/90 rounded-full p-4 hover:bg-p2p-electric/90 transition-colors">
            <Play className="w-12 h-12 text-white" fill="currentColor" />
          </div>
        </button>
      )}
    </>
  );
}
