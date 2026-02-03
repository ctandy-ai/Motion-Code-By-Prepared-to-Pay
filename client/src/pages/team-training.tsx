import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import type { TeamSession, SessionParticipant, Athlete } from "@shared/schema";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const participantStatusColors: Record<string, string> = {
  registered: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  attended: "bg-green-500/20 text-green-400 border-green-500/30",
  missed: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function TeamTraining() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TeamSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<TeamSession | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    location: "",
    maxAthletes: "",
  });
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);

  const { data: sessions = [], isLoading, error } = useQuery<TeamSession[]>({
    queryKey: ["/api/team-sessions"],
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: participants = [], refetch: refetchParticipants } = useQuery<SessionParticipant[]>({
    queryKey: ["/api/team-sessions", selectedSession?.id, "participants"],
    enabled: !!selectedSession,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/team-sessions", {
        name: formData.name,
        description: formData.description || undefined,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: formData.duration,
        location: formData.location || undefined,
        maxAthletes: formData.maxAthletes ? parseInt(formData.maxAthletes) : undefined,
      });
      return response.json();
    },
    onSuccess: async (session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-sessions"] });
      for (const athleteId of selectedAthletes) {
        await apiRequest("POST", `/api/team-sessions/${session.id}/participants`, { athleteId });
      }
      toast({ title: "Session created" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create session", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/team-sessions/${id}`, {
        name: formData.name,
        description: formData.description || undefined,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: formData.duration,
        location: formData.location || undefined,
        maxAthletes: formData.maxAthletes ? parseInt(formData.maxAthletes) : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-sessions"] });
      toast({ title: "Session updated" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update session", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/team-sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-sessions"] });
      toast({ title: "Session deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete session", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/team-sessions/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-sessions"] });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      const response = await apiRequest("POST", `/api/team-sessions/${selectedSession?.id}/participants`, {
        athleteId,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchParticipants();
      toast({ title: "Athlete added" });
    },
    onError: () => {
      toast({ title: "Failed to add athlete", variant: "destructive" });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      await apiRequest("DELETE", `/api/team-sessions/${selectedSession?.id}/participants/${athleteId}`);
    },
    onSuccess: () => {
      refetchParticipants();
      toast({ title: "Athlete removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove athlete", variant: "destructive" });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      const response = await apiRequest("POST", `/api/team-sessions/${selectedSession?.id}/participants/${athleteId}/check-in`);
      return response.json();
    },
    onSuccess: () => {
      refetchParticipants();
      toast({ title: "Athlete checked in" });
    },
    onError: () => {
      toast({ title: "Failed to check in athlete", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSession(null);
    setFormData({
      name: "",
      description: "",
      scheduledAt: "",
      duration: 60,
      location: "",
      maxAthletes: "",
    });
    setSelectedAthletes([]);
  };

  const openEditDialog = (session: TeamSession) => {
    setEditingSession(session);
    setFormData({
      name: session.name,
      description: session.description || "",
      scheduledAt: format(new Date(session.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      duration: session.duration,
      location: session.location || "",
      maxAthletes: session.maxAthletes?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const openParticipantsDialog = (session: TeamSession) => {
    setSelectedSession(session);
    setIsParticipantsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Session name is required", variant: "destructive" });
      return;
    }
    if (!formData.scheduledAt) {
      toast({ title: "Scheduled date/time is required", variant: "destructive" });
      return;
    }
    if (editingSession) {
      updateMutation.mutate(editingSession.id);
    } else {
      createMutation.mutate();
    }
  };

  const getSessionTimeInfo = (session: TeamSession) => {
    const date = new Date(session.scheduledAt);
    if (isToday(date)) return { label: "Today", color: "text-amber-400" };
    if (isFuture(date)) return { label: "Upcoming", color: "text-blue-400" };
    if (isPast(date)) return { label: "Past", color: "text-slate-400" };
    return { label: "", color: "" };
  };

  const participantIds = participants.map(p => p.athleteId);
  const availableAthletes = athletes.filter(a => !participantIds.includes(a.id));

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load team sessions. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="team-training-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
            <Users2 className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Team Training</h1>
            <p className="text-sm text-slate-400">Schedule and manage group workout sessions</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-session">
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users2 className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">No team sessions yet</p>
            <p className="text-slate-500 text-sm">Create your first group training session</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const timeInfo = getSessionTimeInfo(session);
            return (
              <Card
                key={session.id}
                className="bg-slate-800/50 border-slate-700"
                data-testid={`session-card-${session.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base text-slate-100 truncate" data-testid={`text-session-name-${session.id}`}>
                        {session.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className={statusColors[session.status]}>
                          {session.status.replace('_', ' ')}
                        </Badge>
                        {timeInfo.label && (
                          <span className={`text-xs ${timeInfo.color}`}>{timeInfo.label}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(session)}
                        data-testid={`button-edit-session-${session.id}`}
                      >
                        <Edit2 className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(session.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-session-${session.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {session.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">{session.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(session.scheduledAt), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(session.scheduledAt), "h:mm a")} ({session.duration} min)</span>
                    </div>
                    {session.location && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{session.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openParticipantsDialog(session)}
                      className="flex-1"
                      data-testid={`button-manage-participants-${session.id}`}
                    >
                      <Users2 className="h-4 w-4 mr-2" />
                      Manage Athletes
                    </Button>
                    {session.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateStatusMutation.mutate({ id: session.id, status: 'in_progress' })}
                        data-testid={`button-start-session-${session.id}`}
                      >
                        <Play className="h-4 w-4 text-green-400" />
                      </Button>
                    )}
                    {session.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateStatusMutation.mutate({ id: session.id, status: 'completed' })}
                        data-testid={`button-complete-session-${session.id}`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editingSession ? "Edit Session" : "Create Session"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Morning Strength Session"
                className="bg-slate-800 border-slate-600"
                data-testid="input-session-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Session details..."
                className="bg-slate-800 border-slate-600 resize-none"
                rows={2}
                data-testid="input-session-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-scheduled-at"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-duration"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Weight Room A"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAthletes">Max Athletes (optional)</Label>
                <Input
                  id="maxAthletes"
                  type="number"
                  value={formData.maxAthletes}
                  onChange={(e) => setFormData({ ...formData, maxAthletes: e.target.value })}
                  placeholder="15"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-max-athletes"
                />
              </div>
            </div>

            {!editingSession && athletes.length > 0 && (
              <div className="space-y-2">
                <Label>Add Athletes</Label>
                <div className="max-h-32 overflow-y-auto border border-slate-700 rounded-md p-2 space-y-1">
                  {athletes.map((athlete) => (
                    <div key={athlete.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`athlete-${athlete.id}`}
                        checked={selectedAthletes.includes(athlete.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAthletes([...selectedAthletes, athlete.id]);
                          } else {
                            setSelectedAthletes(selectedAthletes.filter(id => id !== athlete.id));
                          }
                        }}
                      />
                      <Label htmlFor={`athlete-${athlete.id}`} className="text-sm font-normal cursor-pointer">
                        {athlete.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-session"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingSession ? "Save Changes" : "Create Session"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Manage Athletes - {selectedSession?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {participants.length > 0 && (
              <div className="space-y-2">
                <Label>Registered Athletes ({participants.length})</Label>
                <div className="border border-slate-700 rounded-md divide-y divide-slate-700">
                  {participants.map((participant) => {
                    const athlete = athletes.find(a => a.id === participant.athleteId);
                    return (
                      <div key={participant.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-200">
                              {athlete ? athlete.name : 'Unknown Athlete'}
                            </p>
                            <Badge variant="outline" className={`text-xs ${participantStatusColors[participant.status]}`}>
                              {participant.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {participant.status === 'registered' && selectedSession?.status === 'in_progress' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => checkInMutation.mutate(participant.athleteId)}
                              disabled={checkInMutation.isPending}
                              data-testid={`button-check-in-${participant.athleteId}`}
                            >
                              <UserCheck className="h-4 w-4 text-green-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParticipantMutation.mutate(participant.athleteId)}
                            disabled={removeParticipantMutation.isPending}
                            data-testid={`button-remove-participant-${participant.athleteId}`}
                          >
                            <UserX className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {availableAthletes.length > 0 && (
              <div className="space-y-2">
                <Label>Add Athletes</Label>
                <Select
                  onValueChange={(athleteId) => addParticipantMutation.mutate(athleteId)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600" data-testid="select-add-athlete">
                    <SelectValue placeholder="Select athlete to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAthletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {participants.length === 0 && availableAthletes.length === 0 && (
              <div className="text-center py-8">
                <Users2 className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No athletes available</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsParticipantsOpen(false)} data-testid="button-close-participants">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
