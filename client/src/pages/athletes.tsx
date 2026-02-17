import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Athlete, InsertAthlete, Program } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Users as UsersIcon, Upload, Eye, Sparkles, CheckSquare, Target, MessageSquare, X, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAthleteSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type SortColumn = "name" | "team" | "position" | "status" | "dateJoined";
type SortDirection = "asc" | "desc";

export default function Athletes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: athletes, isLoading } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const form = useForm<InsertAthlete>({
    resolver: zodResolver(insertAthleteSchema),
    defaultValues: {
      name: "",
      email: "",
      team: "",
      position: "",
      avatarUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAthlete) =>
      apiRequest("POST", "/api/athletes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Athlete added",
        description: "The athlete has been added successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/athletes/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      toast({
        title: "Athlete removed",
        description: "The athlete has been removed successfully.",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (csvContent: string) => {
      const response = await fetch("/api/athletes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent }),
      });
      if (!response.ok) throw new Error("Import failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      setIsImportDialogOpen(false);
      setCsvFile(null);
      setImportProgress("");
      const message = data.athletesSkipped > 0
        ? `Imported ${data.athletesCreated} athletes, skipped ${data.athletesSkipped} duplicates. Created ${data.teamsCreated} teams.`
        : `Successfully imported ${data.athletesCreated} athletes across ${data.teamsCreated} teams.`;
      toast({
        title: "Import Complete",
        description: message,
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import athletes. Please check your CSV format.",
        variant: "destructive",
      });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ athleteIds, programId }: { athleteIds: string[]; programId: string }) => {
      const results = [];
      for (const athleteId of athleteIds) {
        const result = await apiRequest("POST", `/api/athletes/${athleteId}/assign-program`, { programId });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      setIsBulkAssignOpen(false);
      setSelectedAthletes(new Set());
      setSelectedProgram("");
      toast({
        title: "Programs Assigned",
        description: `Successfully assigned program to ${selectedAthletes.size} athletes.`,
      });
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign program to some athletes.",
        variant: "destructive",
      });
    },
  });

  const bulkMessageMutation = useMutation({
    mutationFn: async ({ athleteIds, content }: { athleteIds: string[]; content: string }) => {
      return apiRequest("POST", "/api/messages/broadcast", { athleteIds, content });
    },
    onSuccess: (data: any) => {
      setIsBulkMessageOpen(false);
      setBulkMessage("");
      setSelectedAthletes(new Set());
      toast({
        title: "Messages Sent",
        description: `Sent message to ${data.sent} athletes.`,
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send messages.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAthlete) => {
    createMutation.mutate(data);
  };

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(athleteId)) {
        newSet.delete(athleteId);
      } else {
        newSet.add(athleteId);
      }
      return newSet;
    });
  };

  const selectAllAthletes = () => {
    if (selectedAthletes.size === filteredAthletes?.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(filteredAthletes?.map(a => a.id) || []));
    }
  };

  const handleBulkAssign = () => {
    if (selectedProgram && selectedAthletes.size > 0) {
      bulkAssignMutation.mutate({
        athleteIds: Array.from(selectedAthletes),
        programId: selectedProgram,
      });
    }
  };

  const handleBulkMessage = () => {
    if (bulkMessage.trim() && selectedAthletes.size > 0) {
      bulkMessageMutation.mutate({
        athleteIds: Array.from(selectedAthletes),
        content: bulkMessage.trim(),
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setImportProgress(`Selected: ${file.name}`);
    }
  };

  const handleImport = async () => {
    if (!csvFile) return;
    
    setImportProgress("Reading file...");
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      setImportProgress("Importing athletes...");
      importMutation.mutate(csvContent);
    };
    
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the CSV file.",
        variant: "destructive",
      });
    };
    
    reader.readAsText(csvFile);
  };

  const uniqueTeams = useMemo(() => {
    if (!athletes) return [];
    const teams = new Set(athletes.map(a => a.team).filter(Boolean) as string[]);
    return Array.from(teams).sort();
  }, [athletes]);

  const uniquePositions = useMemo(() => {
    if (!athletes) return [];
    const positions = new Set(athletes.map(a => a.position).filter(Boolean) as string[]);
    return Array.from(positions).sort();
  }, [athletes]);

  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];
    let result = athletes.filter((athlete) =>
      athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.team?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterTeam !== "all") {
      result = result.filter(a => a.team === filterTeam);
    }
    if (filterPosition !== "all") {
      result = result.filter(a => a.position === filterPosition);
    }
    result.sort((a, b) => {
      let aVal = "";
      let bVal = "";
      switch (sortColumn) {
        case "name": aVal = a.name; bVal = b.name; break;
        case "team": aVal = a.team || ""; bVal = b.team || ""; break;
        case "position": aVal = a.position || ""; bVal = b.position || ""; break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        case "dateJoined": aVal = a.dateJoined ? String(a.dateJoined) : ""; bVal = b.dateJoined ? String(b.dateJoined) : ""; break;
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return result;
  }, [athletes, searchQuery, filterTeam, filterPosition, sortColumn, sortDirection]);

  const activeFilterCount = (filterTeam !== "all" ? 1 : 0) + (filterPosition !== "all" ? 1 : 0);

  const toggleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    return sortDirection === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Athletes"
        icon={UsersIcon}
        description="Manage your athlete roster and assign training programs."
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/athletes/new/ai")}
              data-testid="button-ai-onboarding"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Add Athlete
            </Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} data-testid="button-import-athletes">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-athlete">
              <Plus className="h-4 w-4 mr-2" />
              Add Athlete
            </Button>
          </>
        }
      />

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Athletes from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="csv-upload" className="text-sm font-medium">
                Upload TeamBuildr CSV Export
              </label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                data-testid="input-csv-file"
              />
              {importProgress && (
                <p className="text-sm text-muted-foreground">{importProgress}</p>
              )}
            </div>
            <div className="rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold text-sm mb-2 text-foreground">CSV Format:</h4>
              <p className="text-xs text-muted-foreground">
                Expected columns: FIRST, LAST, EMAIL, PHONE, GROUPS, CALENDAR, STATUS
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Athletes will be automatically assigned to their groups/teams.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!csvFile || importMutation.isPending}
              data-testid="button-start-import"
            >
              {importMutation.isPending ? "Importing..." : "Import Athletes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Add New Athlete</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. John Smith" 
                          {...field} 
                          data-testid="input-athlete-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="athlete@example.com" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-athlete-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="team"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Varsity Football" 
                            {...field}
                            value={field.value || ""}
                            data-testid="input-athlete-team"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Quarterback" 
                            {...field}
                            value={field.value || ""}
                            data-testid="input-athlete-position"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-athlete"
                  >
                    {createMutation.isPending ? "Adding..." : "Add Athlete"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              data-testid="input-search-athletes"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[160px]" data-testid="filter-team">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {uniqueTeams.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-[160px]" data-testid="filter-position">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {uniquePositions.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterTeam("all"); setFilterPosition("all"); }}
                data-testid="button-clear-filters"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 md:ml-auto">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              data-testid="button-view-table"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("card")}
              data-testid="button-view-card"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground" data-testid="text-athlete-count">
            {filteredAthletes.length} athlete{filteredAthletes.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 ? " (filtered)" : ""}
          </p>
          {filteredAthletes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllAthletes}
                data-testid="button-select-all"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                {selectedAthletes.size === filteredAthletes.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedAthletes.size > 0 && (
                <>
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedAthletes.size} selected
                  </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAthletes(new Set())}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default" data-testid="button-bulk-assign">
                      <Target className="h-4 w-4 mr-1" />
                      Assign Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Program Assignment</DialogTitle>
                      <DialogDescription>
                        Assign a training program to {selectedAthletes.size} selected athletes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Program</label>
                        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                          <SelectTrigger data-testid="select-program">
                            <SelectValue placeholder="Choose a program..." />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map(program => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="rounded-lg bg-card border border-border p-3">
                        <p className="text-sm text-muted-foreground">
                          Athletes to assign:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(selectedAthletes).slice(0, 5).map(id => {
                            const athlete = athletes?.find(a => a.id === id);
                            return athlete ? (
                              <Badge key={id} variant="outline" className="text-xs">
                                {athlete.name}
                              </Badge>
                            ) : null;
                          })}
                          {selectedAthletes.size > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{selectedAthletes.size - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBulkAssign}
                        disabled={!selectedProgram || bulkAssignMutation.isPending}
                        data-testid="button-confirm-assign"
                      >
                        {bulkAssignMutation.isPending ? "Assigning..." : "Assign to All"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" data-testid="button-bulk-message">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Message Selected Athletes</DialogTitle>
                      <DialogDescription>
                        Send a message to {selectedAthletes.size} selected athletes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <textarea
                        className="w-full h-32 rounded-lg bg-card border border-border p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Type your message..."
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                        data-testid="textarea-bulk-message"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsBulkMessageOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBulkMessage}
                        disabled={!bulkMessage.trim() || bulkMessageMutation.isPending}
                        data-testid="button-confirm-message"
                      >
                        {bulkMessageMutation.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[240px] rounded-lg bg-card border border-border animate-shimmer" />
          ))}
        </div>
      ) : filteredAthletes.length > 0 ? (
        viewMode === "table" ? (
          <Card className="overflow-hidden" data-testid="athletes-table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedAthletes.size === filteredAthletes.length && filteredAthletes.length > 0}
                      onCheckedChange={selectAllAthletes}
                      data-testid="checkbox-select-all-table"
                    />
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("name")} className="flex items-center font-medium" data-testid="sort-name">
                      Name <SortIcon col="name" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <button onClick={() => toggleSort("team")} className="flex items-center font-medium" data-testid="sort-team">
                      Team <SortIcon col="team" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <button onClick={() => toggleSort("position")} className="flex items-center font-medium" data-testid="sort-position">
                      Position <SortIcon col="position" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <button onClick={() => toggleSort("status")} className="flex items-center font-medium" data-testid="sort-status">
                      Status <SortIcon col="status" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <button onClick={() => toggleSort("dateJoined")} className="flex items-center font-medium" data-testid="sort-joined">
                      Joined <SortIcon col="dateJoined" />
                    </button>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAthletes.map((athlete) => (
                  <TableRow
                    key={athlete.id}
                    className={`hover-elevate cursor-pointer ${selectedAthletes.has(athlete.id) ? 'bg-brand-500/10' : ''}`}
                    data-testid={`row-athlete-${athlete.id}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedAthletes.has(athlete.id)}
                        onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                        data-testid={`checkbox-athlete-${athlete.id}`}
                      />
                    </TableCell>
                    <TableCell onClick={() => setLocation(`/athletes/${athlete.id}`)}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-brand-600 text-white text-xs font-semibold">
                            {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate" data-testid={`text-name-${athlete.id}`}>
                            {athlete.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate md:hidden">
                            {athlete.team || "No team"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => setLocation(`/athletes/${athlete.id}`)}>
                      {athlete.team ? (
                        <Badge variant="secondary" className="text-xs">{athlete.team}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => setLocation(`/athletes/${athlete.id}`)}>
                      <span className="text-sm text-muted-foreground">{athlete.position || "--"}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell" onClick={() => setLocation(`/athletes/${athlete.id}`)}>
                      <Badge variant={athlete.status === "Active" ? "default" : "secondary"} className="text-xs">
                        {athlete.status || "Registered"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" onClick={() => setLocation(`/athletes/${athlete.id}`)}>
                      {athlete.dateJoined ? new Date(athlete.dateJoined).toLocaleDateString() : "--"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/athletes/${athlete.id}`)}
                        data-testid={`button-view-${athlete.id}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAthletes.map((athlete) => (
              <Card 
                key={athlete.id} 
                className={`hover-elevate transition-all duration-200 ${selectedAthletes.has(athlete.id) ? 'ring-2 ring-brand-500' : ''}`} 
                data-testid={`athlete-card-${athlete.id}`}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Checkbox
                        checked={selectedAthletes.has(athlete.id)}
                        onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                        className="absolute -top-1 -left-1 z-10 h-5 w-5"
                        data-testid={`checkbox-athlete-${athlete.id}`}
                      />
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-brand-600 text-white text-xl font-bold">
                          {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg font-semibold text-foreground truncate">
                        {athlete.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {athlete.email}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {athlete.team && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{athlete.team}</Badge>
                      {athlete.position && (
                        <Badge variant="outline">{athlete.position}</Badge>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Joined {athlete.dateJoined ? new Date(athlete.dateJoined).toLocaleDateString() : "Unknown"}
                  </p>
                </CardContent>

                <CardFooter className="gap-2 border-t pt-4 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => setLocation(`/athletes/${athlete.id}`)}
                    data-testid={`button-view-${athlete.id}`}
                  >
                    View Profile
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setLocation(`/athlete/${athlete.id}/portal`)}
                    data-testid={`button-portal-${athlete.id}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Portal
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(athlete.id)}
                    data-testid={`button-delete-${athlete.id}`}
                  >
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <UsersIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
            No athletes found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || activeFilterCount > 0
              ? "Try adjusting your search or filters" 
              : "Get started by adding your first athlete"}
          </p>
          {!searchQuery && activeFilterCount === 0 && (
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-athlete">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Athlete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
