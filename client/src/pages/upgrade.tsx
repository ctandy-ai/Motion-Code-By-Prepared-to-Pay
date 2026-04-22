import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function Upgrade() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/pricing", { replace: true }); }, []);
  return (
    <div className="min-h-screen bg-[#0A0C12] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF6432] animate-spin" />
    </div>
  );
}
