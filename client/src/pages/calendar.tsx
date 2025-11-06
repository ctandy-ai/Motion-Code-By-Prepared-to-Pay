import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Athlete, AthleteProgram, WorkoutLog, Exercise, ProgramExercise } from "@shared/schema";
import { format, isSameDay, startOfMonth, endOfMonth, parseISO, isWithinInterval, isBefore, isAfter } from "date-fns";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
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

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['/api/athletes'],
  });

  const { data: athletePrograms = [] } = useQuery<AthleteProgram[]>({
    queryKey: ['/api/athlete-programs'],
  });

  const { data: allWorkoutLogs = [] } = useQuery<WorkoutLog[]>({
    queryKey: ['/api/workout-logs'],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });

  const { data: allProgramExercises = [] } = useQuery<ProgramExercise[]>({
    queryKey: ['/api/program-exercises'],
  });

  const filteredPrograms = selectedAthleteId === "all" 
    ? athletePrograms 
    : athletePrograms.filter(ap => ap.athleteId === selectedAthleteId);

  const filteredLogs = selectedAthleteId === "all"
    ? allWorkoutLogs
    : allWorkoutLogs.filter(log => log.athleteId === selectedAthleteId);

  const getCompletedWorkoutsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return filteredLogs.filter(log => {
      if (!log.completedAt) return false;
      const completedDate = new Date(log.completedAt);
      return isSameDay(completedDate, date);
    });
  };

  // Map program exercises to specific calendar dates
  const getScheduledExercisesForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    targetDate.setHours(0, 0, 0, 0);
    
    const scheduledExercises: Array<{
      athleteProgram: AthleteProgram;
      programExercise: ProgramExercise;
      exercise: Exercise;
    }> = [];
    
    filteredPrograms.forEach(ap => {
      if (ap.status !== 'active' || !ap.startDate) return;
      
      const programStartDate = new Date(ap.startDate);
      programStartDate.setHours(0, 0, 0, 0);
      
      const programExercises = allProgramExercises.filter(pe => pe.programId === ap.programId);
      
      programExercises.forEach(pe => {
        // Calculate the scheduled date for this exercise
        const weekOffset = (pe.weekNumber - 1) * 7;
        const dayOffset = pe.dayNumber - 1;
        const scheduledDate = new Date(programStartDate);
        scheduledDate.setDate(scheduledDate.getDate() + weekOffset + dayOffset);
        
        // Check if this exercise is scheduled for the target date
        if (isSameDay(scheduledDate, targetDate)) {
          const exercise = exercises.find(e => e.id === pe.exerciseId);
          if (exercise) {
            scheduledExercises.push({
              athleteProgram: ap,
              programExercise: pe,
              exercise
            });
          }
        }
      });
    });
    
    return scheduledExercises;
  };

  const getScheduledWorkoutsCountForDay = (day: number) => {
    return getScheduledExercisesForDay(day).length;
  };

  const getUpcomingWorkouts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredPrograms
      .filter(ap => {
        if (ap.status !== 'active' || !ap.startDate) return false;
        const startDate = new Date(ap.startDate);
        return !isBefore(startDate, today);
      })
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 4);
  };

  const getProgramExercises = (programId: string) => {
    return allProgramExercises.filter(pe => pe.programId === programId);
  };

  const selectedDayData = selectedDay ? {
    completed: getCompletedWorkoutsForDay(selectedDay),
    scheduledExercises: getScheduledExercisesForDay(selectedDay),
  } : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold text-slate-100">Training Calendar</h1>
          <p className="text-slate-400 mt-2">
            Schedule and track workouts across your entire program.
          </p>
        </div>
        <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
          <SelectTrigger className="w-[200px]" data-testid="select-athlete-filter">
            <SelectValue placeholder="Filter by athlete" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Athletes</SelectItem>
            {athletes.map((athlete) => (
              <SelectItem key={athlete.id} value={athlete.id}>
                {athlete.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bglass shadow-glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-2xl text-slate-100">
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
                className="text-center text-sm font-semibold text-slate-400 py-2"
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

              const completedWorkouts = getCompletedWorkoutsForDay(day);
              const scheduledCount = getScheduledWorkoutsCountForDay(day);
              const hasActivity = completedWorkouts.length > 0 || scheduledCount > 0;

              return (
                <div
                  key={day}
                  onClick={() => hasActivity && setSelectedDay(day)}
                  className={`aspect-square p-2 border rounded-lg transition-all ${
                    hasActivity ? "hover-elevate cursor-pointer" : ""
                  } ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                  data-testid={`calendar-day-${day}`}
                >
                  <div className="flex flex-col h-full">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-primary" : "text-slate-100"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 flex-1 flex flex-col gap-1 items-center justify-center">
                      {completedWorkouts.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-slate-400">{completedWorkouts.length}</span>
                        </div>
                      )}
                      {scheduledCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-slate-400">{scheduledCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bglass shadow-glass border-0">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-slate-100">Upcoming Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getUpcomingWorkouts().length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No active programs scheduled
                </p>
              ) : (
                getUpcomingWorkouts().map((program) => {
                  const athlete = athletes.find(a => a.id === program.athleteId);
                  return (
                    <div 
                      key={program.id} 
                      className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                      data-testid={`upcoming-workout-${program.id}`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {athlete?.name || 'Unknown Athlete'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {program.startDate ? format(parseISO(program.startDate.toString()), 'MMM d, yyyy') : 'No date'}
                        </p>
                      </div>
                      <Badge variant="secondary">{program.status}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bglass shadow-glass border-0">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-slate-100">Workout Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Total Completed</p>
                <p className="text-3xl font-bold text-slate-100">{filteredLogs.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Programs</p>
                <p className="text-3xl font-bold text-slate-100">
                  {filteredPrograms.filter(ap => ap.status === 'active').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">This Month</p>
                <p className="text-3xl font-bold text-slate-100">
                  {filteredLogs.filter(log => {
                    if (!log.completedAt) return false;
                    const logDate = parseISO(log.completedAt.toString());
                    return logDate.getMonth() === currentDate.getMonth() &&
                           logDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {selectedDay && format(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay), 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDayData && (
            <div className="space-y-6">
              {selectedDayData.completed.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Completed Workouts ({selectedDayData.completed.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedDayData.completed.map((log) => {
                      const athlete = athletes.find(a => a.id === log.athleteId);
                      const exercise = exercises.find(e => e.id === log.exerciseId);
                      return (
                        <Card key={log.id} className="bglass shadow-glass border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-100">{exercise?.name || 'Unknown Exercise'}</p>
                                <p className="text-sm text-slate-400">{athlete?.name || 'Unknown Athlete'}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary">{log.sets} sets</Badge>
                                <p className="text-xs text-slate-400 mt-1">
                                  {log.weightPerSet} lbs
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDayData.scheduledExercises.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Scheduled Exercises ({selectedDayData.scheduledExercises.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedDayData.scheduledExercises.map((item, idx) => {
                      const athlete = athletes.find(a => a.id === item.athleteProgram.athleteId);
                      return (
                        <Card key={`${item.athleteProgram.id}-${item.programExercise.id}-${idx}`} className="bglass shadow-glass border-0">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-base text-slate-100">{item.exercise.name}</p>
                                  <p className="text-sm text-slate-400">{athlete?.name || 'Unknown'}</p>
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                  {item.programExercise.sets}×{item.programExercise.reps}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>Week {item.programExercise.weekNumber}</span>
                                <span>•</span>
                                <span>Day {item.programExercise.dayNumber}</span>
                                {item.programExercise.restSeconds && (
                                  <>
                                    <span>•</span>
                                    <span>{item.programExercise.restSeconds}s rest</span>
                                  </>
                                )}
                              </div>
                              {item.programExercise.notes && (
                                <p className="text-xs text-slate-400 mt-2 pt-2 border-t">
                                  {item.programExercise.notes}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDayData.completed.length === 0 && selectedDayData.scheduledExercises.length === 0 && (
                <p className="text-center text-slate-400 py-8">
                  No workouts scheduled or completed on this day
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
