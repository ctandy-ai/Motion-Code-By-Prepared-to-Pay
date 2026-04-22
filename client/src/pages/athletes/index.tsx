import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, Upload, Search, User, Mail, CheckSquare,
  Trash2, BookOpen, ChevronRight, Copy, CheckCheck,
  Activity, Calendar, X, Download, AlertCircle
} from "lucide-react";

const NAV_COLORS = "bg-[#0C1A27] text-[#EEF2F6]";
const CARD = "bg-[#132130] border border-[#1A2D3F] rounded-xl";

export default function Athletes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [detailAthleteId, setDetailAthleteId] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "" });
  const [csvText, setCsvText] = useState("");
  const [bulkProgramId, setBulkProgramId] = useState("");
  const [createdCreds, setCreatedCreds] = useState<{ email: string; tempPassword: string } | null>(null);
  const [csvResults, setCsvResults] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: athletes = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/athletes"] });
  const { data: programs = [] } = useQuery<any[]>({ queryKey: ["/api/programs"] });
  const { data: detail } = useQuery<any>({
    queryKey: ["/api/athletes", detailAthleteId, "detail"],
    queryFn: async () => {
      if (!detailAthleteId) return null;
      const res = await fetch(`/api/athletes/${detailAthleteId}/detail`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!detailAthleteId,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/athletes/invite", data),
    onSuccess: async (res) => {
      const data = await res.json();
      setCreatedCreds({ email: data.user.email, tempPassword: data.tempPassword });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      setAddForm({ firstName: "", lastName: "", email: "" });
    },
    onError: async (err: any) => {
      const msg = err?.message || "Failed to create athlete";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const csvMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/athletes/csv-import", data),
    onSuccess: async (res) => {
      const data = await res.json();
      setCsvResults(data.results || []);
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      toast({ title: `Imported ${data.imported} athletes`, description: `${data.results.length} rows processed` });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/athletes/bulk-assign", data),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: `Assigned to program`, description: `${data.assigned} athletes updated` });
      setShowBulkAssign(false);
      setSelected([]);
    },
    onError: () => toast({ title: "Assignment failed", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/athletes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      setSelected([]);
      toast({ title: "Athletes removed" });
    },
  });

  const filtered = athletes.filter(a =>
    `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(a => selected.includes(a.id));

  function toggleSelect(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  function toggleAll() {
    if (allSelected) setSelected([]);
    else setSelected(filtered.map(a => a.id));
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string || "");
    reader.readAsText(file);
  }

  const tierColor = (tier: string) => {
    if (tier === "pro") return "bg-[#FF6432]/20 text-[#FF6432] border-[#FF6432]/30";
    if (tier === "season_pass" || tier === "nso_granted") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (tier === "trial") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#EEF2F6]">Athletes</h1>
            <p className="text-sm text-[#6A8499]">{athletes.length} total · {selected.length > 0 ? `${selected.length} selected` : "manage your squad"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCsvModal(true)} className="border-[#1A2D3F] text-[#EEF2F6] hover:bg-[#1A2D3F]">
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <Button onClick={() => { setCreatedCreds(null); setShowAddModal(true); }} className="bg-[#FF6432] hover:bg-[#e5522a] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Athlete
            </Button>
          </div>
        </div>

        {/* Search + bulk toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A8499]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] placeholder:text-[#6A8499]"
            />
          </div>
          {selected.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-[#6A8499]">{selected.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => setShowBulkAssign(true)} className="border-[#1A2D3F] text-[#EEF2F6] hover:bg-[#1A2D3F]">
                <BookOpen className="w-3 h-3 mr-1" /> Assign Program
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                if (confirm(`Remove ${selected.length} athletes from your squad?`)) {
                  selected.forEach(id => removeMutation.mutate(id));
                }
              }} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-3 h-3 mr-1" /> Remove
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])} className="text-[#6A8499]">
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Athletes list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#FF6432] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <User className="w-12 h-12 text-[#6A8499] mx-auto mb-4" />
            <p className="text-[#EEF2F6] font-semibold mb-1">{search ? "No athletes match your search" : "No athletes yet"}</p>
            <p className="text-[#6A8499] text-sm mb-4">{search ? "Try a different name or email" : "Add athletes one-by-one or import a CSV"}</p>
            {!search && (
              <Button onClick={() => setShowAddModal(true)} className="bg-[#FF6432] hover:bg-[#e5522a] text-white">
                <Plus className="w-4 h-4 mr-2" /> Add First Athlete
              </Button>
            )}
          </div>
        ) : (
          <div className={CARD}>
            {/* Select all header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A2D3F]">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-[#1A2D3F]" />
              <span className="text-xs text-[#6A8499] uppercase tracking-wider">Select all ({filtered.length})</span>
            </div>

            {filtered.map((a, i) => (
              <div key={a.id} className={`flex items-center gap-3 px-4 py-4 hover:bg-[#1A2D3F]/50 transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-[#1A2D3F]" : ""}`}>
                <Checkbox
                  checked={selected.includes(a.id)}
                  onCheckedChange={() => toggleSelect(a.id)}
                  className="border-[#1A2D3F]"
                  onClick={e => e.stopPropagation()}
                />
                <div
                  className="flex-1 flex items-center gap-3 min-w-0"
                  onClick={() => setDetailAthleteId(a.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF6432]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6432] font-bold text-sm">
                      {(a.firstName?.[0] || "?")}{(a.lastName?.[0] || "")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#EEF2F6] font-medium truncate">{a.firstName} {a.lastName}</p>
                    <p className="text-[#6A8499] text-xs truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />{a.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`text-xs border ${tierColor(a.subscriptionTier || "starter")}`}>
                    {a.subscriptionTier || "starter"}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-[#6A8499]" onClick={() => setDetailAthleteId(a.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD ATHLETE MODAL ── */}
      <Dialog open={showAddModal} onOpenChange={v => { setShowAddModal(v); if (!v) setCreatedCreds(null); }}>
        <DialogContent className="bg-[#0C1A27] border-[#1A2D3F] text-[#EEF2F6] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#EEF2F6]">Add Athlete</DialogTitle>
          </DialogHeader>

          {createdCreds ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                <CheckCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-semibold">Athlete account created!</p>
                <p className="text-[#6A8499] text-sm mt-1">Share these login details with your athlete</p>
              </div>
              <div className={`${CARD} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6A8499]">Email</p>
                    <p className="text-[#EEF2F6] font-mono text-sm">{createdCreds.email}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdCreds.email, "email")} className="text-[#6A8499]">
                    {copiedId === "email" ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="border-t border-[#1A2D3F]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6A8499]">Temporary password</p>
                    <p className="text-[#EEF2F6] font-mono text-sm">{createdCreds.tempPassword}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdCreds.tempPassword, "pass")} className="text-[#6A8499]">
                    {copiedId === "pass" ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-[#6A8499] text-center">The athlete should change their password after first login via Settings.</p>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#FF6432] hover:bg-[#e5522a]" onClick={() => { setCreatedCreds(null); }}>
                  Add Another
                </Button>
                <Button variant="outline" className="flex-1 border-[#1A2D3F] text-[#EEF2F6]" onClick={() => setShowAddModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#6A8499] text-sm">First name</Label>
                  <Input
                    value={addForm.firstName}
                    onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                    className="bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] mt-1"
                    placeholder="Anna"
                  />
                </div>
                <div>
                  <Label className="text-[#6A8499] text-sm">Last name</Label>
                  <Input
                    value={addForm.lastName}
                    onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                    className="bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] mt-1"
                    placeholder="Davies"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[#6A8499] text-sm">Email address</Label>
                <Input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] mt-1"
                  placeholder="anna@example.com"
                />
              </div>
              <div className="bg-[#132130] border border-[#1A2D3F] rounded-lg p-3 flex gap-2 text-sm text-[#6A8499]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>A temporary password will be generated. Share it with your athlete so they can log in.</span>
              </div>
              <Button
                className="w-full bg-[#FF6432] hover:bg-[#e5522a] text-white"
                disabled={!addForm.firstName || !addForm.lastName || !addForm.email || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate(addForm)}
              >
                {inviteMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CSV IMPORT MODAL ── */}
      <Dialog open={showCsvModal} onOpenChange={v => { setShowCsvModal(v); if (!v) { setCsvText(""); setCsvResults([]); } }}>
        <DialogContent className="bg-[#0C1A27] border-[#1A2D3F] text-[#EEF2F6] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#EEF2F6]">Import Athletes via CSV</DialogTitle>
          </DialogHeader>

          {csvResults.length > 0 ? (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {csvResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#EEF2F6] truncate">{r.email}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {r.status === "created" && r.tempPassword && (
                        <span className="text-[#6A8499] font-mono text-xs">{r.tempPassword}</span>
                      )}
                      <Badge className={`text-xs ${r.status === "created" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-[#1A2D3F] text-[#EEF2F6]"
                onClick={() => {
                  const csv = csvResults.map(r => `${r.email},${r.status},${r.tempPassword || ""}`).join("\n");
                  const blob = new Blob([`email,status,temp_password\n${csv}`], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "athlete-credentials.csv"; a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Download Credentials CSV
              </Button>
              <Button className="w-full bg-[#FF6432] hover:bg-[#e5522a]" onClick={() => setShowCsvModal(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${CARD} p-3`}>
                <p className="text-xs text-[#6A8499] font-semibold uppercase tracking-wider mb-1">CSV Format</p>
                <p className="text-[#EEF2F6] font-mono text-xs">firstName,lastName,email</p>
                <p className="text-[#6A8499] font-mono text-xs">Anna,Davies,anna@netball.com</p>
                <p className="text-[#6A8499] font-mono text-xs">Sarah,Jones,sarah@netball.com</p>
              </div>

              <div>
                <Label className="text-[#6A8499] text-sm">Upload CSV file</Label>
                <Input type="file" accept=".csv,.txt" onChange={handleCsvFile} className="bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] mt-1 cursor-pointer" />
              </div>

              <div>
                <Label className="text-[#6A8499] text-sm">Or paste CSV text</Label>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  rows={6}
                  placeholder={"Anna,Davies,anna@netball.com\nSarah,Jones,sarah@netball.com"}
                  className="w-full mt-1 px-3 py-2 bg-[#132130] border border-[#1A2D3F] rounded-lg text-[#EEF2F6] text-sm font-mono placeholder:text-[#6A8499] resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6432]"
                />
                <p className="text-xs text-[#6A8499] mt-1">{csvText.trim().split(/\r?\n/).filter(l => l.trim()).length} rows detected</p>
              </div>

              <Button
                className="w-full bg-[#FF6432] hover:bg-[#e5522a] text-white"
                disabled={!csvText.trim() || csvMutation.isPending}
                onClick={() => csvMutation.mutate({ csvText })}
              >
                {csvMutation.isPending ? "Importing..." : "Import Athletes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── BULK ASSIGN MODAL ── */}
      <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
        <DialogContent className="bg-[#0C1A27] border-[#1A2D3F] text-[#EEF2F6] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#EEF2F6]">Assign Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#6A8499] text-sm">Assigning to {selected.length} athlete{selected.length !== 1 ? "s" : ""}</p>
            <div>
              <Label className="text-[#6A8499] text-sm">Select program</Label>
              <Select value={bulkProgramId} onValueChange={setBulkProgramId}>
                <SelectTrigger className="bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] mt-1">
                  <SelectValue placeholder="Choose a program..." />
                </SelectTrigger>
                <SelectContent className="bg-[#132130] border-[#1A2D3F]">
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-[#EEF2F6]">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[#FF6432] hover:bg-[#e5522a] text-white"
              disabled={!bulkProgramId || bulkAssignMutation.isPending}
              onClick={() => bulkAssignMutation.mutate({ athleteIds: selected, programId: Number(bulkProgramId) })}
            >
              {bulkAssignMutation.isPending ? "Assigning..." : "Assign to Program"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ATHLETE DETAIL MODAL ── */}
      <Dialog open={!!detailAthleteId} onOpenChange={v => { if (!v) setDetailAthleteId(null); }}>
        <DialogContent className="bg-[#0C1A27] border-[#1A2D3F] text-[#EEF2F6] max-w-xl max-h-[80vh] overflow-y-auto">
          {detail ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF6432]/20 flex items-center justify-center">
                    <span className="text-[#FF6432] font-bold">
                      {detail.athlete.firstName?.[0]}{detail.athlete.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <DialogTitle className="text-[#EEF2F6]">{detail.athlete.firstName} {detail.athlete.lastName}</DialogTitle>
                    <p className="text-[#6A8499] text-sm">{detail.athlete.email}</p>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="bg-[#132130] border border-[#1A2D3F] w-full">
                  <TabsTrigger value="profile" className="flex-1 data-[state=active]:bg-[#FF6432] data-[state=active]:text-white">Profile</TabsTrigger>
                  <TabsTrigger value="sessions" className="flex-1 data-[state=active]:bg-[#FF6432] data-[state=active]:text-white">Sessions</TabsTrigger>
                  <TabsTrigger value="progress" className="flex-1 data-[state=active]:bg-[#FF6432] data-[state=active]:text-white">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4 space-y-3">
                  <div className={`${CARD} p-4 grid grid-cols-2 gap-4`}>
                    <div>
                      <p className="text-xs text-[#6A8499]">Subscription</p>
                      <Badge className={`mt-1 text-xs border ${tierColor(detail.athlete.subscriptionTier)}`}>
                        {detail.athlete.subscriptionTier || "starter"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-[#6A8499]">Sessions completed</p>
                      <p className="text-[#EEF2F6] font-semibold mt-1">{detail.sessionCount}</p>
                    </div>
                    {detail.profile?.sport && (
                      <div>
                        <p className="text-xs text-[#6A8499]">Sport</p>
                        <p className="text-[#EEF2F6] capitalize mt-1">{detail.profile.sport}</p>
                      </div>
                    )}
                    {detail.profile?.position && (
                      <div>
                        <p className="text-xs text-[#6A8499]">Position</p>
                        <p className="text-[#EEF2F6] mt-1">{detail.profile.position}</p>
                      </div>
                    )}
                    {detail.profile?.currentBelt && (
                      <div>
                        <p className="text-xs text-[#6A8499]">Belt level</p>
                        <p className="text-[#EEF2F6] capitalize mt-1">{detail.profile.currentBelt}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMutation.mutate(detail.athlete.id)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full"
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> Remove from squad
                  </Button>
                </TabsContent>

                <TabsContent value="sessions" className="mt-4">
                  {detail.recentSessions.length === 0 ? (
                    <div className="text-center py-8 text-[#6A8499]">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No sessions completed yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detail.recentSessions.map((s: any) => (
                        <div key={s.id} className={`${CARD} p-3 flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#FF6432]" />
                            <span className="text-[#EEF2F6] text-sm">{s.sessionName || "Training session"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#6A8499] text-xs">
                            <Calendar className="w-3 h-3" />
                            {s.completedAt ? new Date(s.completedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="progress" className="mt-4">
                  <div className={`${CARD} p-4 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6A8499] text-sm">Total sessions</span>
                      <span className="text-[#EEF2F6] font-bold">{detail.sessionCount}</span>
                    </div>
                    <div className="w-full bg-[#1A2D3F] rounded-full h-2">
                      <div
                        className="bg-[#FF6432] h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (detail.sessionCount / 20) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6A8499]">{Math.max(0, 20 - detail.sessionCount)} sessions to next belt milestone</p>
                    {detail.profile?.currentStreak > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#1A2D3F]">
                        <span className="text-[#6A8499] text-sm">Current streak</span>
                        <span className="text-[#FF6432] font-bold">{detail.profile.currentStreak} days 🔥</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#FF6432] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
