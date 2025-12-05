import { useCallback, useState } from 'react';
import { enqueueRequest } from '../services/syncQueue';
import { useOffline } from './useOffline';
import { useSnackbar } from './useSnackbar';

interface UseOfflineMutationOptions<TVariables, TResult> {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
  serializeBody?: (variables: TVariables) => any;
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
  onQueuedMessage?: string;
}

interface UseOfflineMutationResult<TVariables, TResult> {
  mutate: (variables: TVariables) => Promise<TResult | null>;
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
}

const DEFAULT_QUEUED_MESSAGE = 'Tersimpan ke antrian offline. Akan terkirim otomatis saat online.';

export function useOfflineMutation<TVariables = any, TResult = any>(
  options: UseOfflineMutationOptions<TVariables, TResult>,
): UseOfflineMutationResult<TVariables, TResult> {
  const { isOnline } = useOffline();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    mutationFn,
    endpoint,
    method = 'POST',
    headers,
    serializeBody,
    onSuccess,
    onError,
    onQueuedMessage,
  } = options;

  const mutate = useCallback(async (variables: TVariables) => {
    if (isOnline) {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const normalizedError = err instanceof Error ? err : new Error('Unknown error');
        setError(normalizedError);
        onError?.(err);
        throw normalizedError;
      } finally {
        setLoading(false);
      }
    }

    const body = serializeBody ? serializeBody(variables) : (variables as unknown);
    await enqueueRequest(endpoint, method, body, headers);
    showSnackbar({
      message: onQueuedMessage ?? DEFAULT_QUEUED_MESSAGE,
      variant: 'info',
    });
    return null;
  }, [endpoint, headers, isOnline, method, mutationFn, onError, onQueuedMessage, onSuccess, serializeBody, showSnackbar]);

  return {
    mutate,
    loading,
    error,
    isOnline,
  };
}
