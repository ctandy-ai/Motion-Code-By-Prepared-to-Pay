import { useQuery } from "@tanstack/react-query";

export const USER_ROLES = {
  HEAD_COACH: 'head_coach',
  ASSISTANT_COACH: 'assistant_coach',
  ATHLETE: 'athlete',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface Permissions {
  canManageAthletes: boolean;
  canManagePrograms: boolean;
  canDeleteAthletes: boolean;
  canBroadcastMessages: boolean;
  canAccessAI: boolean;
  canManageTeams: boolean;
  canViewAnalytics: boolean;
  canEditSettings: boolean;
  canAssignPrograms: boolean;
}

interface PermissionsResponse {
  role: UserRole;
  permissions: Permissions;
  availableRoles: string[];
}

export function usePermissions() {
  const { data, isLoading, error } = useQuery<PermissionsResponse>({
    queryKey: ["/api/user/permissions"],
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Default to ATHLETE (least-privileged) permissions for security
  // Never default to full permissions on error/loading
  const athletePermissions: Permissions = {
    canManageAthletes: false,
    canManagePrograms: false,
    canDeleteAthletes: false,
    canBroadcastMessages: false,
    canAccessAI: false,
    canManageTeams: false,
    canViewAnalytics: false,
    canEditSettings: false,
    canAssignPrograms: false,
  };

  // When loading or on error, default to minimal permissions for security
  const effectiveRole = data?.role || USER_ROLES.ATHLETE;
  const effectivePermissions = data?.permissions || athletePermissions;

  return {
    role: effectiveRole,
    permissions: effectivePermissions,
    availableRoles: data?.availableRoles || Object.values(USER_ROLES),
    isLoading,
    error,
    hasError: !!error,
    isHeadCoach: effectiveRole === USER_ROLES.HEAD_COACH || effectiveRole === USER_ROLES.ADMIN,
    isCoach: effectiveRole === USER_ROLES.HEAD_COACH || effectiveRole === USER_ROLES.ASSISTANT_COACH || effectiveRole === USER_ROLES.ADMIN,
    isAthlete: effectiveRole === USER_ROLES.ATHLETE,
    isAdmin: effectiveRole === USER_ROLES.ADMIN,
  };
}

export function getRoleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "destructive";
    case USER_ROLES.HEAD_COACH:
      return "default";
    case USER_ROLES.ASSISTANT_COACH:
      return "secondary";
    case USER_ROLES.ATHLETE:
      return "outline";
    default:
      return "outline";
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "Administrator";
    case USER_ROLES.HEAD_COACH:
      return "Head Coach";
    case USER_ROLES.ASSISTANT_COACH:
      return "Assistant Coach";
    case USER_ROLES.ATHLETE:
      return "Athlete";
    default:
      return role;
  }
}
