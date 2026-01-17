import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  RefreshCw, 
  Link as LinkIcon, 
  Users, 
  Activity, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  Zap,
  Search,
  Sparkles,
  ChevronsUpDown,
  Check,
  User
} from "lucide-react";

interface ValdConfig {
  isConfigured: boolean;
  region: string;
  hasTenantId: boolean;
}

interface ValdProfile {
  id: string;
  athleteId: string | null;
  valdProfileId: string;
  valdTenantId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  syncedAt: string;
}

interface ValdSyncLog {
  id: string;
  syncType: string;
  status: string;
  recordsProcessed: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface Athlete {
  id: string;
  name: string;
  email: string | null;
  team: string | null;
}

interface MatchedAthlete extends Athlete {
  matchScore: number;
  matchReason: string;
}

function calculateNameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (n1 === n2) return 100;
  
  const tokens1 = n1.split(/\s+/).filter(Boolean);
  const tokens2 = n2.split(/\s+/).filter(Boolean);
  
  let matchedTokens = 0;
  for (const t1 of tokens1) {
    for (const t2 of tokens2) {
      if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) {
        matchedTokens++;
        break;
      }
    }
  }
  
  const totalTokens = Math.max(tokens1.length, tokens2.length);
  if (totalTokens === 0) return 0;
  
  return Math.round((matchedTokens / totalTokens) * 100);
}

function findBestMatches(
  profile: ValdProfile, 
  athletes: Athlete[], 
  linkedAthleteIds: Set<string>
): MatchedAthlete[] {
  const profileName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const profileEmail = profile.email?.toLowerCase() || '';
  
  const matches: MatchedAthlete[] = athletes
    .filter(a => !linkedAthleteIds.has(a.id))
    .map(athlete => {
      const nameScore = calculateNameSimilarity(profileName, athlete.name);
      
      let emailBonus = 0;
      let matchReason = '';
      
      if (profileEmail && athlete.email) {
        const athleteEmail = athlete.email.toLowerCase();
        if (profileEmail === athleteEmail) {
          emailBonus = 30;
          matchReason = 'Email match';
        } else if (profileEmail.split('@')[0] === athleteEmail.split('@')[0]) {
          emailBonus = 15;
          matchReason = 'Email username match';
        }
      }
      
      const totalScore = Math.min(100, nameScore + emailBonus);
      
      if (!matchReason) {
        if (nameScore >= 90) matchReason = 'Exact name match';
        else if (nameScore >= 70) matchReason = 'Name match';
        else if (nameScore >= 50) matchReason = 'Partial name match';
        else matchReason = '';
      }
      
      return {
        ...athlete,
        matchScore: totalScore,
        matchReason,
      };
    })
    .filter(m => m.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
  
  return matches.slice(0, 5);
}

export default function ValdIntegration() {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState("forcedecks");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ValdProfile | null>(null);
  const [athleteSearchOpen, setAthleteSearchOpen] = useState(false);
  const [athleteSearch, setAthleteSearch] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const { data: config } = useQuery<ValdConfig>({
    queryKey: ["/api/vald/config"],
  });

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery<ValdProfile[]>({
    queryKey: ["/api/vald/profiles"],
  });

  const { data: syncLogs = [] } = useQuery<ValdSyncLog[]>({
    queryKey: ["/api/vald/sync-logs"],
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const syncProfilesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/vald/sync/profiles"),
    onSuccess: (data: any) => {
      toast({
        title: "Profiles synced",
        description: `Processed ${data.processed} new profiles out of ${data.total} total`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vald/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vald/sync-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync profiles",
        variant: "destructive",
      });
    },
  });

  const syncTestsMutation = useMutation({
    mutationFn: (deviceType: string) => 
      apiRequest("POST", "/api/vald/sync/tests", { deviceType }),
    onSuccess: (data: any) => {
      toast({
        title: "Tests synced",
        description: `Processed ${data.processed} new tests out of ${data.total} total`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vald/sync-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync tests",
        variant: "destructive",
      });
    },
  });

  const linkProfileMutation = useMutation({
    mutationFn: ({ profileId, athleteId }: { profileId: string; athleteId: string }) =>
      apiRequest("POST", `/api/vald/profiles/${profileId}/link`, { athleteId }),
    onSuccess: () => {
      toast({
        title: "Profile linked",
        description: "VALD profile successfully linked to athlete",
      });
      setLinkDialogOpen(false);
      setSelectedProfile(null);
      setSelectedAthleteId(null);
      setAthleteSearch("");
      setAthleteSearchOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vald/profiles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Link failed",
        description: error.message || "Failed to link profile",
        variant: "destructive",
      });
    },
  });

  const linkedProfiles = profiles.filter(p => p.athleteId);
  const unlinkedProfiles = profiles.filter(p => !p.athleteId);
  const linkedAthleteIds = useMemo(() => new Set(profiles.filter(p => p.athleteId).map(p => p.athleteId!)), [profiles]);
  
  const availableAthletes = useMemo(() => 
    athletes.filter(a => !linkedAthleteIds.has(a.id)), 
    [athletes, linkedAthleteIds]
  );
  
  const suggestedMatches = useMemo(() => {
    if (!selectedProfile) return [];
    return findBestMatches(selectedProfile, athletes, linkedAthleteIds);
  }, [selectedProfile, athletes, linkedAthleteIds]);
  
  const filteredAthletes = useMemo(() => {
    if (!athleteSearch) return availableAthletes;
    const search = athleteSearch.toLowerCase();
    return availableAthletes.filter(a => 
      a.name.toLowerCase().includes(search) ||
      a.email?.toLowerCase().includes(search) ||
      a.team?.toLowerCase().includes(search)
    );
  }, [availableAthletes, athleteSearch]);
  
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold" data-testid="text-page-title">VALD Hub Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect and sync athlete testing data from VALD Hub
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config?.isConfigured ? (
            <Badge className="bg-green-500/20 text-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected ({config.region})
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400">
              <Settings className="w-3 h-3 mr-1" />
              Not Configured
            </Badge>
          )}
        </div>
      </div>

      {!config?.isConfigured && (
        <Card className="bglass border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Settings className="w-5 h-5" />
              Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To connect VALD Hub, you'll need API credentials from VALD. Email{" "}
              <span className="text-primary font-medium">support@vald.com</span> with your 
              VALD Hub Organization ID to request access.
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Required credentials:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>VALD_CLIENT_ID - Your client ID</li>
                <li>VALD_CLIENT_SECRET - Your client secret</li>
                <li>VALD_REGION - Your region (AUE, WEU, or EUS)</li>
                <li>VALD_TENANT_ID - Your organization's tenant ID (optional)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bglass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">VALD Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bglass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <LinkIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{linkedProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Linked Athletes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bglass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Activity className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unlinkedProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Unlinked Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList className="bglass">
          <TabsTrigger value="profiles" data-testid="tab-profiles">
            <Users className="w-4 h-4 mr-2" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="sync" data-testid="tab-sync">
            <Database className="w-4 h-4 mr-2" />
            Sync Data
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <Activity className="w-4 h-4 mr-2" />
            Sync History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card className="bglass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>VALD Profiles</CardTitle>
                <CardDescription>
                  Manage and link VALD profiles to your athletes
                </CardDescription>
              </div>
              <Button 
                onClick={() => syncProfilesMutation.mutate()}
                disabled={!config?.isConfigured || syncProfilesMutation.isPending}
                data-testid="button-sync-profiles"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncProfilesMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Profiles
              </Button>
            </CardHeader>
            <CardContent>
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No VALD profiles synced yet</p>
                  <p className="text-sm">Click "Sync Profiles" to import from VALD Hub</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Linked Athlete</TableHead>
                      <TableHead>Last Synced</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => {
                      const linkedAthlete = athletes.find(a => a.id === profile.athleteId);
                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.firstName} {profile.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {profile.email || "-"}
                          </TableCell>
                          <TableCell>
                            {linkedAthlete ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                {linkedAthlete.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                                Unlinked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(profile.syncedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {!profile.athleteId && (
                              <Dialog open={linkDialogOpen && selectedProfile?.id === profile.id} onOpenChange={(open) => {
                                setLinkDialogOpen(open);
                                if (!open) {
                                  setSelectedProfile(null);
                                  setSelectedAthleteId(null);
                                  setAthleteSearch("");
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedProfile(profile);
                                      setSelectedAthleteId(null);
                                      setAthleteSearch("");
                                      setAthleteSearchOpen(false);
                                    }}
                                    data-testid={`button-link-profile-${profile.id}`}
                                  >
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    Link
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bglass max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>Link VALD Profile</DialogTitle>
                                    <DialogDescription>
                                      Link {profile.firstName} {profile.lastName} to an athlete
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">VALD Profile</p>
                                        <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                                        {profile.email && <p className="text-xs text-muted-foreground">{profile.email}</p>}
                                      </div>
                                      {selectedAthlete && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Selected Athlete</p>
                                          <p className="font-medium">{selectedAthlete.name}</p>
                                          {selectedAthlete.team && <p className="text-xs text-muted-foreground">{selectedAthlete.team}</p>}
                                        </div>
                                      )}
                                    </div>

                                    {suggestedMatches.length > 0 && suggestedMatches[0].matchScore >= 50 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <Sparkles className="w-4 h-4 text-yellow-500" />
                                          <span>Suggested Matches</span>
                                        </div>
                                        <div className="space-y-2">
                                          {suggestedMatches.slice(0, 3).filter(m => m.matchScore >= 50).map((match) => (
                                            <div 
                                              key={match.id}
                                              className="flex items-center justify-between p-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                  <User className="w-4 h-4 text-yellow-500" />
                                                </div>
                                                <div>
                                                  <p className="font-medium text-sm">{match.name}</p>
                                                  <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                                                      {match.matchScore}% match
                                                    </Badge>
                                                    {match.matchReason && (
                                                      <span className="text-xs text-muted-foreground">{match.matchReason}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <Button
                                                size="sm"
                                                onClick={() => linkProfileMutation.mutate({ profileId: profile.id, athleteId: match.id })}
                                                disabled={linkProfileMutation.isPending}
                                                data-testid={`button-quick-link-${match.id}`}
                                              >
                                                <LinkIcon className="w-3 h-3 mr-1" />
                                                Link
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <p className="text-sm font-medium flex items-center gap-2">
                                        <Search className="w-4 h-4" />
                                        Search All Athletes
                                      </p>
                                      <Popover open={athleteSearchOpen} onOpenChange={setAthleteSearchOpen}>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={athleteSearchOpen}
                                            className="w-full justify-between"
                                            data-testid="combobox-athlete-search"
                                          >
                                            {selectedAthlete ? selectedAthlete.name : "Search by name, email, or team..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                          <Command shouldFilter={false}>
                                            <CommandInput 
                                              placeholder="Search athletes..." 
                                              value={athleteSearch}
                                              onValueChange={setAthleteSearch}
                                              data-testid="input-athlete-search"
                                            />
                                            <CommandList>
                                              <CommandEmpty>No athletes found.</CommandEmpty>
                                              <CommandGroup>
                                                {filteredAthletes.slice(0, 10).map((athlete) => (
                                                  <CommandItem
                                                    key={athlete.id}
                                                    value={athlete.id}
                                                    onSelect={() => {
                                                      setSelectedAthleteId(athlete.id);
                                                      setAthleteSearchOpen(false);
                                                    }}
                                                    data-testid={`option-athlete-${athlete.id}`}
                                                  >
                                                    <Check className={`mr-2 h-4 w-4 ${selectedAthleteId === athlete.id ? 'opacity-100' : 'opacity-0'}`} />
                                                    <div className="flex-1">
                                                      <p className="font-medium">{athlete.name}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {[athlete.team, athlete.email].filter(Boolean).join(' · ')}
                                                      </p>
                                                    </div>
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    {selectedAthleteId && (
                                      <Button
                                        className="w-full"
                                        onClick={() => linkProfileMutation.mutate({ profileId: profile.id, athleteId: selectedAthleteId })}
                                        disabled={linkProfileMutation.isPending}
                                        data-testid="button-confirm-link"
                                      >
                                        {linkProfileMutation.isPending ? (
                                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <LinkIcon className="w-4 h-4 mr-2" />
                                        )}
                                        Link to {selectedAthlete?.name}
                                      </Button>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card className="bglass">
            <CardHeader>
              <CardTitle>Sync Test Data</CardTitle>
              <CardDescription>
                Import testing data from VALD devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Device Type</label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger data-testid="select-device-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forcedecks">ForceDecks</SelectItem>
                      <SelectItem value="nordbord">NordBord</SelectItem>
                      <SelectItem value="dynamo">DynaMo</SelectItem>
                      <SelectItem value="smartspeed">SmartSpeed</SelectItem>
                      <SelectItem value="airband">AirBand</SelectItem>
                      <SelectItem value="humantrak">HumanTrak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => syncTestsMutation.mutate(selectedDevice)}
                  disabled={!config?.isConfigured || syncTestsMutation.isPending}
                  data-testid="button-sync-tests"
                >
                  <Zap className={`w-4 h-4 mr-2 ${syncTestsMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync {selectedDevice.charAt(0).toUpperCase() + selectedDevice.slice(1)} Tests
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: "forcedecks", name: "ForceDecks", desc: "Force plate testing" },
                  { id: "nordbord", name: "NordBord", desc: "Hamstring strength" },
                  { id: "dynamo", name: "DynaMo", desc: "Dynamometry" },
                  { id: "smartspeed", name: "SmartSpeed", desc: "Timing gates" },
                  { id: "airband", name: "AirBand", desc: "Jump monitoring" },
                  { id: "humantrak", name: "HumanTrak", desc: "3D motion capture" },
                ].map((device) => (
                  <Card 
                    key={device.id} 
                    className={`bglass cursor-pointer transition-all hover:border-primary/50 ${
                      selectedDevice === device.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedDevice(device.id)}
                  >
                    <CardContent className="pt-4">
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bglass">
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                Recent synchronization activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sync history yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium capitalize">
                          {log.syncType.replace("-", " ")}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{log.recordsProcessed}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.completedAt ? new Date(log.completedAt).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-red-400 max-w-xs truncate">
                          {log.errorMessage || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
