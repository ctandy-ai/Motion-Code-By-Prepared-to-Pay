import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  MapPin, 
  Phone,
  Mail,
  Globe, 
  Shield,
  ArrowRight,
  CheckCircle2,
  Filter,
  X,
  Star,
  Info
} from "lucide-react";
import type { Clinic, ClinicReferral } from "@shared/schema";

const states = [
  { id: "all", name: "All States" },
  { id: "NSW", name: "New South Wales" },
  { id: "VIC", name: "Victoria" },
  { id: "QLD", name: "Queensland" },
  { id: "WA", name: "Western Australia" },
  { id: "SA", name: "South Australia" },
  { id: "TAS", name: "Tasmania" },
  { id: "NT", name: "Northern Territory" },
  { id: "ACT", name: "ACT" }
];

const serviceFilters = [
  { id: "tripleHop", name: "Triple Hop Test", key: "isTripleHopProvider" },
  { id: "screening", name: "Movement Screening", key: "isMovementScreeningProvider" },
  { id: "rehabBond", name: "Rehab Bond Clinic", key: "isRehabBondClinic" },
  { id: "p2p", name: "Prepared to Play Partner", key: "isPreparedToPlayPartner" }
];

export default function FindClinic() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [referralClinic, setReferralClinic] = useState<Clinic | null>(null);
  const [referralSuccess, setReferralSuccess] = useState<{ clinic: Clinic; referral: ClinicReferral } | null>(null);

  const { data: clinics, isLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics", selectedState, selectedServices.join(","), searchQuery]
  });

  const referMutation = useMutation({
    mutationFn: async ({ clinicId, referralType }: { clinicId: number; referralType: string }) => {
      const res = await apiRequest("POST", `/api/clinics/${clinicId}/refer`, { referralType });
      return res.json();
    },
    onSuccess: (data) => {
      setReferralClinic(null);
      setReferralSuccess({ clinic: data.clinic, referral: data.referral });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/referrals"] });
      toast({ title: "Referral Created", description: `You've been referred to ${data.clinic.name}` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create referral. Please try again.", variant: "destructive" });
    }
  });

  const filteredClinics = clinics?.filter(clinic => {
    const matchesSearch = !searchQuery || 
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.suburb.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = selectedState === "all" || clinic.state === selectedState;
    
    const matchesServices = selectedServices.length === 0 || 
      selectedServices.every(service => {
        const key = serviceFilters.find(s => s.id === service)?.key as keyof Clinic;
        return clinic[key];
      });

    return matchesSearch && matchesState && matchesServices;
  }) || [];

  function toggleService(serviceId: string) {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  }

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:p-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">
            Find a Clinic
          </h1>
          <p className="text-gray-400 text-lg">
            Connect with Prepared to Play network clinics for professional assessment and care
          </p>
        </div>

        {/* Triple Hop primary CTA banner */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="text-white font-semibold text-sm">Triple Hop Assessment</span>
              <span className="text-gray-400 text-sm ml-2">— a validated test for ACL risk and return-to-sport readiness</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedServices(prev => 
              prev.includes("tripleHop") ? prev.filter(s => s !== "tripleHop") : [...prev, "tripleHop"]
            )}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              selectedServices.includes("tripleHop")
                ? "bg-blue-500 border-blue-500 text-white"
                : "bg-transparent border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
            }`}
            data-testid="filter-triple-hop-primary"
          >
            {selectedServices.includes("tripleHop") ? "✓ Showing Triple Hop Providers" : "Show Triple Hop Providers"}
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by clinic name or suburb..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                data-testid="input-search-clinic"
              />
            </div>
            
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              data-testid="select-state"
            >
              {states.map(state => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-gray-700 ${selectedServices.length > 0 ? "text-p2p-electric border-p2p-electric" : "text-gray-300"}`}
              data-testid="button-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters {selectedServices.length > 0 && `(${selectedServices.length})`}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-3">Filter by services:</p>
              <div className="flex flex-wrap gap-2">
                {serviceFilters.map(service => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all
                      ${selectedServices.includes(service.id)
                        ? "bg-p2p-electric text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    data-testid={`filter-${service.id}`}
                  >
                    {service.name}
                  </button>
                ))}
                {selectedServices.length > 0 && (
                  <button
                    onClick={() => setSelectedServices([])}
                    className="px-4 py-2 rounded-full text-sm text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-800 rounded-full w-24" />
                  <div className="h-6 bg-gray-800 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-white mb-2">
              No clinics found
            </h3>
            <p className="text-gray-400">
              {searchQuery || selectedState !== "all" || selectedServices.length > 0
                ? "Try adjusting your search or filters"
                : "Provider network coming soon to your area"
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredClinics.map(clinic => (
              <div 
                key={clinic.id}
                className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all"
                data-testid={`clinic-${clinic.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-bold text-white mb-1">
                      {clinic.name}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{clinic.address}</span>
                    </div>
                  </div>
                  {clinic.isPreparedToPlayPartner && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 ml-3"
                         style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: 'rgba(212, 175, 55, 0.4)' }}>
                      <Shield className="w-4 h-4" style={{ color: '#D4AF37' }} />
                      <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>P2P Certified</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  {clinic.phone && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <a href={`tel:${clinic.phone}`} className="hover:text-white transition-colors">{clinic.phone}</a>
                    </div>
                  )}
                  {clinic.email && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <a href={`mailto:${clinic.email}`} className="hover:text-white transition-colors">{clinic.email}</a>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {clinic.isTripleHopProvider && (
                    <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs rounded-full font-semibold flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Triple Hop Provider
                    </span>
                  )}
                  {clinic.isMovementScreeningProvider && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      Movement Screening
                    </span>
                  )}
                  {clinic.isRehabBondClinic && (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                      Rehab Bond
                    </span>
                  )}
                  {clinic.services?.map((service: string) => (
                    <span key={service} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full capitalize">
                      {service}
                    </span>
                  ))}
                </div>

                {clinic.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {clinic.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {clinic.website && (
                    <a 
                      href={clinic.bookingUrl || clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 rounded-lg text-sm text-white font-medium transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      Book Assessment
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReferralClinic(clinic)}
                      className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Refer Me
                    </Button>
                  )}
                  {clinic.website && (
                    <a 
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-2xl p-8 text-center">
          <h3 className="font-heading text-2xl font-bold text-white mb-2">
            Are you a clinic or provider?
          </h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Join the Prepared to Play network and connect with athletes looking for professional movement assessment and rehabilitation services.
          </p>
          <Button 
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:opacity-90"
            onClick={() => window.location.href = "/signup?role=clinician"}
            data-testid="button-join-network"
          >
            Join the Provider Network
          </Button>
        </div>
      </div>

      {referralClinic && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReferralClinic(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-white">Create Referral</h3>
              <button onClick={() => setReferralClinic(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Request a referral to <span className="text-white font-medium">{referralClinic.name}</span>
            </p>
            <div className="space-y-2 mb-6">
              {(["assessment", "treatment", "prevention"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => referMutation.mutate({ clinicId: referralClinic.id, referralType: type })}
                  disabled={referMutation.isPending}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white text-sm transition-colors disabled:opacity-50"
                >
                  <span className="capitalize">{type}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
            {referMutation.isPending && (
              <p className="text-center text-gray-400 text-sm">Creating referral...</p>
            )}
          </div>
        </div>
      )}

      {referralSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReferralSuccess(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: '#D4AF37' }} />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">Referral Confirmed!</h3>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-white font-medium">{referralSuccess.clinic.name}</p>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{referralSuccess.clinic.address}</span>
              </div>
              {referralSuccess.clinic.phone && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${referralSuccess.clinic.phone}`} className="hover:text-white">{referralSuccess.clinic.phone}</a>
                </div>
              )}
              {referralSuccess.clinic.email && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${referralSuccess.clinic.email}`} className="hover:text-white">{referralSuccess.clinic.email}</a>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs text-center mb-4">
              Your referral has been recorded. Contact the clinic directly to schedule your appointment.
            </p>
            <Button 
              onClick={() => setReferralSuccess(null)} 
              className="w-full bg-gradient-to-r from-p2p-blue to-p2p-electric"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
