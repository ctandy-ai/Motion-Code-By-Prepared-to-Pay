import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

interface PartnerOrgBranding {
  id: number;
  name: string;
  slug: string;
  sportName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  welcomeMessage: string | null;
}

export function usePartnerOrg() {
  const { isAuthenticated } = useAuth();

  const { data: partnerOrg, isLoading } = useQuery<PartnerOrgBranding | null>({
    queryKey: ["/api/user/partner-org"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isWhiteLabel = !!partnerOrg;

  return {
    partnerOrg,
    isWhiteLabel,
    isLoading,
    primaryColor: partnerOrg?.primaryColor || "#2563EB",
    secondaryColor: partnerOrg?.secondaryColor || "#0A0C12",
    logoUrl: partnerOrg?.logoUrl || null,
    sportName: partnerOrg?.sportName || "Movement",
  };
}
