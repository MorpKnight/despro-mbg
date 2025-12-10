export {};

declare global {
  interface Window {
    nfcAPI?: {
      onScan: (cb: (data: NfcScanPayload) => void) => void;
      onStatus?: (cb: (data: NfcStatusPayload) => void) => void;
      onError?: (cb: (data: NfcErrorPayload) => void) => void;
    };
  }

  type NfcScanPayload = {
    reader: string;
    uid: string | null;
    atr?: string | null;
    scannedAt: string;
  };

  type NfcStatusPayload = {
    status: "connected" | "disconnected";
    reader: string;
    at: string;
  };

  type NfcErrorPayload = {
    reader: string | null;
    message: string;
  };
}
