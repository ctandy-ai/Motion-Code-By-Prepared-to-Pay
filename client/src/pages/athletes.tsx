import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Athlete, InsertAthlete } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Users as UsersIcon, Upload } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAthleteSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Athletes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: athletes, isLoading } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
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

  const onSubmit = (data: InsertAthlete) => {
    createMutation.mutate(data);
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

  const filteredAthletes = athletes?.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bglass rounded-2xl shadow-glass p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-4xl font-bold text-slate-100">Athletes</h1>
          <p className="text-slate-400 mt-2">
            Manage your athlete roster and assign training programs.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-athletes">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
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
                <div className="rounded-lg border-0 p-4 bglass">
                  <h4 className="font-semibold text-sm mb-2 text-slate-100">CSV Format:</h4>
                  <p className="text-xs text-slate-400">
                    Expected columns: FIRST, LAST, EMAIL, PHONE, GROUPS, CALENDAR, STATUS
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
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
            <DialogTrigger asChild>
              <Button data-testid="button-add-athlete">
                <Plus className="h-4 w-4 mr-2" />
                Add Athlete
              </Button>
            </DialogTrigger>
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
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search athletes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500"
          data-testid="input-search-athletes"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[240px] rounded-2xl bglass shadow-glass animate-shimmer" />
          ))}
        </div>
      ) : filteredAthletes && filteredAthletes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAthletes.map((athlete) => (
            <Card key={athlete.id} className="bglass shadow-glass border-0 hover-elevate transition-all duration-200" data-testid={`athlete-card-${athlete.id}`}>
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white text-xl font-bold">
                    {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-slate-100 truncate">
                      {athlete.name}
                    </h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
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
                <p className="text-xs text-slate-500">
                  Joined {new Date(athlete.dateJoined!).toLocaleDateString()}
                </p>
              </CardContent>

              <CardFooter className="gap-2 border-t pt-4">
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
                  variant="outline" 
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
      ) : (
        <div className="text-center py-16">
          <UsersIcon className="mx-auto h-16 w-16 text-slate-500 mb-4" />
          <h3 className="font-heading text-xl font-semibold text-slate-200 mb-2">
            No athletes found
          </h3>
          <p className="text-slate-400 mb-6">
            {searchQuery 
              ? "Try adjusting your search" 
              : "Get started by adding your first athlete"}
          </p>
          {!searchQuery && (
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
