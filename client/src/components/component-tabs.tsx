import { Zap, Hand, ArrowRightLeft, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComponentTabsProps {
  activeComponent: string;
  onComponentChange: (component: string) => void;
}

const components = [
  { 
    id: "acceleration", 
    label: "Starting", 
    subtitle: "Acceleration (300-180ms)",
    icon: Zap 
  },
  { 
    id: "deceleration", 
    label: "Stopping", 
    subtitle: "Sagittal Deceleration (200-250ms)",
    icon: Hand 
  },
  { 
    id: "change-direction", 
    label: "Stepping", 
    subtitle: "High-Speed COD (200-250ms)", 
    icon: ArrowRightLeft 
  },
  { 
    id: "top-speed", 
    label: "Sprinting", 
    subtitle: "Maximum Speed (90-120ms)",
    icon: Gauge 
  },
];

export default function ComponentTabs({ activeComponent, onComponentChange }: ComponentTabsProps) {
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {components.map((component) => {
            const Icon = component.icon;
            const isActive = activeComponent === component.id;
            
            return (
              <Button
                key={component.id}
                variant="ghost"
                onClick={() => onComponentChange(component.id)}
                className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm flex flex-col items-center ${
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center mb-1">
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="font-semibold">{component.label}</span>
                </div>
                <span className="text-xs text-gray-400">{component.subtitle}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
