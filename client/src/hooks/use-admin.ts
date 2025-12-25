import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface AdminCheckResponse {
  isAdmin: boolean;
}

export function useAdmin() {
  const { user } = useAuth();
  
  const { data, isLoading, isError } = useQuery<AdminCheckResponse>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
    staleTime: 0, // Always check fresh to prevent stale cache issues after role changes
    retry: false, // Don't retry 403 responses
  });

  // If there was an error (403) or no user, they're not an admin
  return {
    isAdmin: !isError && data?.isAdmin === true,
    isLoading: isLoading && !isError,
  };
}
