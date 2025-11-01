import { QueryClient } from "@tanstack/react-query";

// Singleton QueryClient to ensure all QueryProviders share the same cache
let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return queryClient;
}
