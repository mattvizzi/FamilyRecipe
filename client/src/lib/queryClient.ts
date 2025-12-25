import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// CSRF token cache
let csrfToken: string | null = null;

// Fetch CSRF token from server
async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  const res = await fetch('/api/csrf-token', {
    credentials: 'include',
  });
  
  if (res.ok) {
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken!;
  }
  
  throw new Error('Failed to fetch CSRF token');
}

// Clear CSRF token (on logout or session expiry)
export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    try {
      const token = await fetchCsrfToken();
      headers["X-CSRF-Token"] = token;
    } catch {
      // If we can't get a token, proceed without it (server will validate)
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 mins
      gcTime: 30 * 60 * 1000, // 30 minutes - cache garbage collected after 30 mins
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper to invalidate recipe-related queries after mutations
export function invalidateRecipeQueries() {
  queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
  queryClient.invalidateQueries({ queryKey: ["/api/recipes/saved"] });
  queryClient.invalidateQueries({ queryKey: ["/api/public/recipes"] });
}

// Helper to invalidate family-related queries after mutations
export function invalidateFamilyQueries() {
  queryClient.invalidateQueries({ queryKey: ["/api/family"] });
}
