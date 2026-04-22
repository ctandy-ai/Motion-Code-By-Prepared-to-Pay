import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBeltLevel: string;
  onBeltLevelChange: (beltLevel: string) => void;
}

export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  selectedBeltLevel,
  onBeltLevelChange,
}: SearchFilterBarProps) {
  const beltLevels = [
    { value: "white", label: "White Belt", color: "bg-gray-500 hover:bg-gray-600" },
    { value: "blue", label: "Blue Belt", color: "bg-blue-500 hover:bg-blue-600" },
    { value: "black", label: "Black Belt", color: "bg-gray-900 hover:bg-gray-800" },
  ];

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Belt Level Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Belt Level:
            </span>
            <div className="flex space-x-2">
              <Button
                variant={selectedBeltLevel === "" ? "default" : "outline"}
                size="sm"
                onClick={() => onBeltLevelChange("")}
                className="text-xs"
              >
                All
              </Button>
              {beltLevels.map((belt) => (
                <Button
                  key={belt.value}
                  variant={selectedBeltLevel === belt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onBeltLevelChange(belt.value)}
                  className={`text-xs text-white ${belt.color} border-0`}
                >
                  {belt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
