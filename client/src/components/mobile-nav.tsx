import { Dumbbell, Bookmark, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileNav() {
  const navItems = [
    { icon: Dumbbell, label: "Exercises", active: true },
    { icon: Bookmark, label: "Saved", active: false },
    { icon: ClipboardList, label: "Programs", active: false },
    { icon: TrendingUp, label: "Progress", active: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200">
      <div className="flex">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className={`flex-1 flex flex-col items-center justify-center py-2 ${
                item.active ? "text-primary-600" : "text-gray-600"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
