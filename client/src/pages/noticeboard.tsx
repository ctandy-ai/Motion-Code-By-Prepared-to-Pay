import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Megaphone, 
  Plus, 
  Pin, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Info,
  Bell,
  Clock,
  Loader2
} from "lucide-react";
import type { Announcement } from "@shared/schema";

const priorityConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  low: { label: "Low", color: "bg-slate-500", icon: Info },
  normal: { label: "Normal", color: "bg-blue-500", icon: Bell },
  high: { label: "High", color: "bg-amber-500", icon: AlertTriangle },
  urgent: { label: "Urgent", color: "bg-red-500", icon: Megaphone },
};

export default function Noticeboard() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    isPinned: false,
  });

  const { data: announcements = [], isLoading, error } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/announcements", {
        ...data,
        isPinned: data.isPinned ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement created" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/announcements/${id}`, {
        ...data,
        isPinned: data.isPinned ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement updated" });
      setEditingAnnouncement(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const response = await apiRequest("PATCH", `/api/announcements/${id}`, {
        isPinned: isPinned ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", priority: "normal", isPinned: false });
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isPinned: announcement.isPinned === 1,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load announcements. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pinnedAnnouncements = announcements.filter(a => a.isPinned === 1);
  const regularAnnouncements = announcements.filter(a => a.isPinned !== 1);

  return (
    <div className="p-6 space-y-6" data-testid="noticeboard-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Megaphone className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Noticeboard</h1>
            <p className="text-sm text-muted-foreground">Announcements and updates for your team</p>
          </div>
        </div>

        <Dialog open={isCreateOpen || !!editingAnnouncement} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingAnnouncement(null);
            resetForm();
          } else {
            setIsCreateOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-announcement">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  className="bg-muted/50 border-border"
                  data-testid="input-announcement-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="bg-muted/50 border-border"
                  data-testid="input-announcement-content"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border" data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="pinned"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                    data-testid="switch-pinned"
                  />
                  <Label htmlFor="pinned" className="text-sm">Pin to top</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingAnnouncement(null);
                    resetForm();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-announcement"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingAnnouncement ? "Save Changes" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="bg-muted/50 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No announcements yet</p>
            <p className="text-muted-foreground text-sm">Create your first announcement to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned Announcements
              </h2>
              <div className="space-y-3">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onTogglePin={(id, isPinned) => togglePinMutation.mutate({ id, isPinned })}
                    formatDate={formatDate}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {regularAnnouncements.length > 0 && (
            <div className="space-y-3">
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground">Recent Announcements</h2>
              )}
              <div className="space-y-3">
                {regularAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onTogglePin={(id, isPinned) => togglePinMutation.mutate({ id, isPinned })}
                    formatDate={formatDate}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  formatDate: (date: Date | string | null) => string;
  isDeleting: boolean;
}

function AnnouncementCard({ 
  announcement, 
  onEdit, 
  onDelete, 
  onTogglePin,
  formatDate,
  isDeleting 
}: AnnouncementCardProps) {
  const config = priorityConfig[announcement.priority] || priorityConfig.normal;
  const PriorityIcon = config.icon;

  return (
    <Card 
      className={`bg-muted/50 border-border ${announcement.isPinned ? 'ring-1 ring-amber-500/30' : ''}`}
      data-testid={`announcement-card-${announcement.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-1.5 rounded ${config.color}/20`}>
              <PriorityIcon className={`h-4 w-4 ${config.color.replace('bg-', 'text-').replace('-500', '-400')}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <span className="truncate" data-testid={`text-announcement-title-${announcement.id}`}>
                  {announcement.title}
                </span>
                {announcement.isPinned === 1 && (
                  <Pin className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={`text-xs ${config.color.replace('bg-', 'text-').replace('-500', '-400')} border-current`}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(announcement.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTogglePin(announcement.id, announcement.isPinned !== 1)}
              data-testid={`button-pin-${announcement.id}`}
            >
              <Pin className={`h-4 w-4 ${announcement.isPinned ? 'text-amber-400' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(announcement)}
              data-testid={`button-edit-${announcement.id}`}
            >
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(announcement.id)}
              disabled={isDeleting}
              data-testid={`button-delete-${announcement.id}`}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-announcement-content-${announcement.id}`}>
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}
