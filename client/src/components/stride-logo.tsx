export function StrideLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 36"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Person/dot at top */}
      <circle cx="12" cy="5" r="4" fill="currentColor" className="opacity-90" />
      
      {/* Main "i" stem */}
      <rect x="9" y="12" width="6" height="22" rx="3" fill="currentColor" />
      
      {/* Subtle motion lines for athletic feel */}
      <path
        d="M4 18 Q6 16, 8 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="opacity-40"
      />
      <path
        d="M16 18 Q18 16, 20 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="opacity-40"
      />
    </svg>
  );
}

export function StrideLogoFull({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StrideLogo className="h-full" />
      <div className="flex flex-col">
        <span className="font-bold text-sm tracking-wider">STRIDE</span>
        <span className="text-[8px] text-muted-foreground tracking-widest">CODE PRO</span>
      </div>
    </div>
  );
}
