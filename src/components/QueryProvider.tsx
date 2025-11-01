import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/queryClient";

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Use singleton QueryClient to ensure all providers share the same cache
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
