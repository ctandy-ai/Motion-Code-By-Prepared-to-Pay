import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Search, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [searchResult, setSearchResult] = useState<{
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
      organizationId: number | null;
    } | null;
    organization: {
      id: number;
      name: string;
      subscriptionStatus: string;
      subscriptionTier: string;
      trialEndsAt: string | null;
    } | null;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/users?email=${encodeURIComponent(searchEmail)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to search user");
      }

      setSearchResult(data);
      
      if (!data.user) {
        toast({
          title: "User not found",
          description: `No user found with email: ${searchEmail}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!searchResult?.user?.id) return;

    setIsGranting(true);
    try {
      const response = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: searchResult.user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to grant access");
      }

      toast({
        title: "Access granted!",
        description: `Complimentary access granted to ${searchResult.user.email}`,
      });

      // Refresh the search to show updated status
      handleSearch();
    } catch (error: any) {
      toast({
        title: "Failed to grant access",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!searchResult?.user?.id || !selectedRole) return;

    setIsUpdatingRole(true);
    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          targetUserId: searchResult.user.id,
          newRole: selectedRole
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      toast({
        title: "Role updated!",
        description: `User role changed to ${selectedRole}`,
      });

      // Refresh the search to show updated role
      handleSearch();
    } catch (error: any) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user || (user as any).role !== 'admin') {
    return (
      <div className="flex min-h-screen bg-p2p-dark">
        <Sidebar user={user || undefined} />
        <div className="flex-1 flex items-center justify-center p-10">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Access Denied</CardTitle>
              <CardDescription>This page is only accessible to administrators.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-p2p-blue" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-gray-400 font-body">Grant complimentary access and manage user roles</p>
          </div>

          {/* Search Section */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Search User</CardTitle>
              <CardDescription>Enter user email to view and manage access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-gray-900/50 border-gray-700 text-white"
                  data-testid="input-search-email"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-p2p-blue hover:bg-p2p-blue/80"
                  data-testid="button-search-user"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searchResult && searchResult.user && (
            <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">User Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-medium" data-testid="text-user-email">{searchResult.user.email}</span>
                  </div>
                  {searchResult.user.firstName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white font-medium">
                        {searchResult.user.firstName} {searchResult.user.lastName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Role:</span>
                    <Badge variant="outline" className="text-white capitalize">{searchResult.user.role}</Badge>
                  </div>
                </div>

                {/* Change Role Section */}
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-white font-semibold mb-3">Change User Role</h3>
                  <div className="flex gap-3">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="flex-1 bg-gray-900/50 border-gray-700 text-white">
                        <SelectValue placeholder="Select new role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="athlete">Athlete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateRole}
                      disabled={isUpdatingRole || !selectedRole}
                      className="bg-p2p-blue hover:bg-p2p-blue/80"
                      data-testid="button-update-role"
                    >
                      {isUpdatingRole ? "Updating..." : "Update Role"}
                    </Button>
                  </div>
                </div>

                {/* Organization Info */}
                {searchResult.organization ? (
                  <>
                    <div className="border-t border-gray-800 pt-4 space-y-3">
                      <h3 className="text-white font-semibold mb-2">Organization Details</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Organization:</span>
                        <span className="text-white font-medium">{searchResult.organization.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Subscription Status:</span>
                        {getStatusBadge(searchResult.organization.subscriptionStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tier:</span>
                        <Badge variant="outline" className="text-white capitalize">
                          {searchResult.organization.subscriptionTier}
                        </Badge>
                      </div>
                      {searchResult.organization.trialEndsAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Trial Ends:</span>
                          <span className="text-white">
                            {new Date(searchResult.organization.trialEndsAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Grant Access Button */}
                    <div className="border-t border-gray-800 pt-4">
                      {searchResult.organization.subscriptionStatus === 'active' && !searchResult.organization.trialEndsAt ? (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                          <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <p className="text-green-400 font-medium">Complimentary access already granted</p>
                        </div>
                      ) : (
                        <Button
                          onClick={handleGrantAccess}
                          disabled={isGranting}
                          className="w-full bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90"
                          data-testid="button-grant-access"
                        >
                          {isGranting ? "Granting Access..." : "Grant Complimentary Access"}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <p className="text-yellow-400">User has no organization. They need to sign up first.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {searchResult && !searchResult.user && (
            <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
              <CardContent className="py-12 text-center">
                <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No user found with email: {searchEmail}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
