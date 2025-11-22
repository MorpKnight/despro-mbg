import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnMount: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => createQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
