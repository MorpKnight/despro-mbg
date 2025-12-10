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

  // untuk "soft cleanup"
  const activeRef = useRef(true);

  const available = useMemo(() => {
    return isWeb && typeof window !== "undefined" && !!window.nfcAPI;
  }, [isWeb]);

  useEffect(() => {
    activeRef.current = true;

    if (!enabled) return;
    if (!isWeb) return;
    if (typeof window === "undefined") return;
    if (!window.nfcAPI) return;

    // reset state tiap enable supaya UI fresh
    setError(null);

    const onScan = (data: NfcScanPayload) => {
      if (!activeRef.current) return;
      setLastScan(data);
    };

    const onStatus = (s: NfcStatusPayload) => {
      if (!activeRef.current) return;
      setStatus(s);
    };

    const onError = (e: NfcErrorPayload) => {
      if (!activeRef.current) return;
      setError(e);
    };

    // NOTE:
    // preload versi kamu kemungkinan belum punya unsubscribe,
    // jadi kita daftar listener sederhana.
    window.nfcAPI.onScan(onScan);
    window.nfcAPI.onStatus?.(onStatus);
    window.nfcAPI.onError?.(onError);

    return () => {
      // "soft stop"
      activeRef.current = false;
    };
  }, [enabled, isWeb]);

  return {
    available,
    lastScan,
    status,
    error,
    clearError: () => setError(null),
  };
}
