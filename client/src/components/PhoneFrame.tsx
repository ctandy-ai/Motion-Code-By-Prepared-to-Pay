interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div className={`relative ${className}`}>
      {/* iPhone Frame */}
      <div className="relative mx-auto" style={{ width: '280px', height: '580px' }}>
        {/* Phone Body */}
        <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl border-8 border-gray-800">
          {/* Screen */}
          <div className="absolute inset-3 bg-black rounded-[2.2rem] overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10" />
            
            {/* Content */}
            <div className="w-full h-full">
              {children}
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gray-700 rounded-full" />
        </div>
        
        {/* Power Button */}
        <div className="absolute right-0 top-24 w-1 h-16 bg-gray-800 rounded-l-lg" />
        
        {/* Volume Buttons */}
        <div className="absolute left-0 top-20 w-1 h-8 bg-gray-800 rounded-r-lg" />
        <div className="absolute left-0 top-32 w-1 h-8 bg-gray-800 rounded-r-lg" />
      </div>
    </div>
  );
}
