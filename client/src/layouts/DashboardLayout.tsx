import Nav from "@/components/Nav";
import { Home, Dumbbell, BookOpen, GraduationCap } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="bg-p2p-dark min-h-screen text-white flex flex-col">
      <Nav />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 bg-black/40 border-r border-white/10">
          <div className="px-5 py-5 font-heading text-lg text-p2p-electric border-b border-white/10">
            Motion Code
          </div>
          <nav className="flex flex-col gap-1 px-2 py-4">
            {[
              { label: "Home", path: "/dashboard", icon: Home },
              { label: "Movement Library", path: "/exercises", icon: Dumbbell },
              { label: "Education", path: "/education", icon: GraduationCap },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-2xl transition flex items-center gap-2 ${
                    isActive 
                      ? "bg-gradient-to-r from-p2p-blue to-p2p-electric text-white" 
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
