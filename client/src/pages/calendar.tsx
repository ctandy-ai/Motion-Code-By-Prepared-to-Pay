import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Training Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Schedule and track workouts across your entire program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-2xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prevMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {days.map((day) => {
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              const hasWorkout = day % 3 === 0;

              return (
                <div
                  key={day}
                  className={`aspect-square p-2 border rounded-lg hover-elevate cursor-pointer transition-all ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid={`calendar-day-${day}`}
                >
                  <div className="flex flex-col h-full">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    {hasWorkout && (
                      <div className="mt-1 flex-1 flex flex-col gap-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
                          Strength
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Upcoming Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                  data-testid={`upcoming-workout-${i}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Upper Body Strength
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tomorrow at 9:00 AM
                    </p>
                  </div>
                  <Badge variant="secondary">12 athletes</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Workout Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Strength", count: 45, color: "bg-blue-500" },
                { type: "Conditioning", count: 28, color: "bg-green-500" },
                { type: "Mobility", count: 15, color: "bg-purple-500" },
                { type: "Recovery", count: 12, color: "bg-orange-500" },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-foreground flex-1">
                    {item.type}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} sessions
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
