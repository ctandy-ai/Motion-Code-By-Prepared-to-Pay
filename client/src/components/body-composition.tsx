import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Scale,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import type { BodyCompositionLog } from "@shared/schema";

interface BodyCompositionProps {
  athleteId: string;
}

export function BodyComposition({ athleteId }: BodyCompositionProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    bodyFat: "",
    muscleMass: "",
    waist: "",
    chest: "",
    hips: "",
    arms: "",
    thighs: "",
    notes: "",
    loggedAt: new Date().toISOString().split("T")[0],
  });

  const { data: logs = [], isLoading, error } = useQuery<BodyCompositionLog[]>({
    queryKey: ["/api/athletes", athleteId, "body-composition"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/body-composition`);
      if (!response.ok) throw new Error("Failed to fetch body composition logs");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: Record<string, unknown> = {
        loggedAt: new Date(data.loggedAt).toISOString(),
        notes: data.notes || null,
      };
      if (data.weight) payload.weight = parseFloat(data.weight);
      if (data.bodyFat) payload.bodyFat = parseFloat(data.bodyFat);
      if (data.muscleMass) payload.muscleMass = parseFloat(data.muscleMass);
      if (data.waist) payload.waist = parseFloat(data.waist);
      if (data.chest) payload.chest = parseFloat(data.chest);
      if (data.hips) payload.hips = parseFloat(data.hips);
      if (data.arms) payload.arms = parseFloat(data.arms);
      if (data.thighs) payload.thighs = parseFloat(data.thighs);

      const response = await apiRequest("POST", `/api/athletes/${athleteId}/body-composition`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "body-composition"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Body composition logged" });
    },
    onError: () => {
      toast({ title: "Failed to log body composition", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/body-composition/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "body-composition"] });
      toast({ title: "Log deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete log", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      weight: "",
      bodyFat: "",
      muscleMass: "",
      waist: "",
      chest: "",
      hips: "",
      arms: "",
      thighs: "",
      notes: "",
      loggedAt: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weight && !formData.bodyFat && !formData.muscleMass) {
      toast({ title: "Please enter at least one measurement", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const getLatestAndPrevious = () => {
    if (logs.length === 0) return { latest: null, previous: null };
    const latest = logs[0];
    const previous = logs.length > 1 ? logs[1] : null;
    return { latest, previous };
  };

  const getDiff = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    return current - previous;
  };

  const formatDiff = (diff: number | null, unit: string, invertColor = false) => {
    if (diff === null) return null;
    const isPositive = diff > 0;
    const color = invertColor
      ? (isPositive ? "text-red-400" : "text-green-400")
      : (isPositive ? "text-green-400" : "text-red-400");
    const Icon = isPositive ? TrendingUp : diff < 0 ? TrendingDown : Minus;
    return (
      <span className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="h-3 w-3" />
        {isPositive ? "+" : ""}{diff.toFixed(1)} {unit}
      </span>
    );
  };

  const { latest, previous } = getLatestAndPrevious();

  const chartData = logs
    .slice()
    .reverse()
    .map((log) => ({
      date: format(new Date(log.loggedAt!), "MMM d"),
      weight: log.weight,
      bodyFat: log.bodyFat,
      muscleMass: log.muscleMass,
    }));

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load body composition data</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="body-composition-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-cyan-400" />
          <CardTitle className="text-base">Body Composition</CardTitle>
        </div>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} data-testid="button-add-composition">
          <Plus className="h-4 w-4 mr-1" />
          Log
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6">
            <Scale className="h-10 w-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No body composition data yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Weight</p>
                <p className="text-xl font-bold text-slate-100" data-testid="text-latest-weight">
                  {latest?.weight ? `${latest.weight} kg` : "--"}
                </p>
                {formatDiff(getDiff(latest?.weight ?? null, previous?.weight ?? null), "kg")}
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Body Fat</p>
                <p className="text-xl font-bold text-slate-100" data-testid="text-latest-bodyfat">
                  {latest?.bodyFat ? `${latest.bodyFat}%` : "--"}
                </p>
                {formatDiff(getDiff(latest?.bodyFat ?? null, previous?.bodyFat ?? null), "%", true)}
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Muscle Mass</p>
                <p className="text-xl font-bold text-slate-100" data-testid="text-latest-muscle">
                  {latest?.muscleMass ? `${latest.muscleMass} kg` : "--"}
                </p>
                {formatDiff(getDiff(latest?.muscleMass ?? null, previous?.muscleMass ?? null), "kg")}
              </div>
            </div>

            {chartData.length >= 2 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={{ fill: "#22d3ee", r: 3 }}
                      name="Weight (kg)"
                    />
                    {chartData.some((d) => d.bodyFat) && (
                      <Line
                        type="monotone"
                        dataKey="bodyFat"
                        stroke="#f472b6"
                        strokeWidth={2}
                        dot={{ fill: "#f472b6", r: 3 }}
                        name="Body Fat (%)"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Recent Logs</p>
              {logs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/30 border border-slate-700/50"
                  data-testid={`composition-log-${log.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-300">
                      {format(new Date(log.loggedAt!), "MMM d, yyyy")}
                    </span>
                    <span className="text-xs text-slate-500">
                      {log.weight && `${log.weight}kg`}
                      {log.bodyFat && ` • ${log.bodyFat}%`}
                      {log.muscleMass && ` • ${log.muscleMass}kg muscle`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(log.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-log-${log.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Log Body Composition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="75.5"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  value={formData.bodyFat}
                  onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                  placeholder="15.0"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-bodyfat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="muscleMass">Muscle Mass (kg)</Label>
                <Input
                  id="muscleMass"
                  type="number"
                  step="0.1"
                  value={formData.muscleMass}
                  onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                  placeholder="32.0"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-muscle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loggedAt">Date</Label>
                <Input
                  id="loggedAt"
                  type="date"
                  value={formData.loggedAt}
                  onChange={(e) => setFormData({ ...formData, loggedAt: e.target.value })}
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Body Measurements (cm)</Label>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <Label className="text-xs">Waist</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.waist}
                    onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-xs"
                    data-testid="input-waist"
                  />
                </div>
                <div>
                  <Label className="text-xs">Chest</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.chest}
                    onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-xs"
                    data-testid="input-chest"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hips</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.hips}
                    onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-xs"
                    data-testid="input-hips"
                  />
                </div>
                <div>
                  <Label className="text-xs">Arms</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.arms}
                    onChange={(e) => setFormData({ ...formData, arms: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-xs"
                    data-testid="input-arms"
                  />
                </div>
                <div>
                  <Label className="text-xs">Thighs</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.thighs}
                    onChange={(e) => setFormData({ ...formData, thighs: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-xs"
                    data-testid="input-thighs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any observations..."
                className="bg-slate-800 border-slate-600 resize-none"
                rows={2}
                data-testid="input-notes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-save-composition"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
