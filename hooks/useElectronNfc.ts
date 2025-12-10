import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

type UseElectronNfcOptions = {
  enabled?: boolean;
};

export function useElectronNfc(options: UseElectronNfcOptions = {}) {
  const { enabled = true } = options;

  const isWeb = Platform.OS === "web";
  const [lastScan, setLastScan] = useState<NfcScanPayload | null>(null);
  const [status, setStatus] = useState<NfcStatusPayload | null>(null);
  const [error, setError] = useState<NfcErrorPayload | null>(null);

  const initializedRef = useRef(false);

  const available = useMemo(() => {
    return isWeb && typeof window !== "undefined" && !!window.nfcAPI;
  }, [isWeb]);

  useEffect(() => {
    if (!enabled) return;
    if (!isWeb) return;
    if (typeof window === "undefined") return;
    if (!window.nfcAPI) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    window.nfcAPI.onScan((data) => setLastScan(data));
    window.nfcAPI.onStatus?.((s) => setStatus(s));
    window.nfcAPI.onError?.((e) => setError(e));
  }, [enabled, isWeb]);

  return {
    available,
    lastScan,
    status,
    error,
    clearError: () => setError(null),
  };
}
