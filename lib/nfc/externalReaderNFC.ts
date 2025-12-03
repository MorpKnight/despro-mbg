let ws: WebSocket | null = null;
let scanCallback: ((uid: string) => void) | null = null;

const RECONNECT_INTERVAL = 3000;

export const connectReader = () => {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  // Buat koneksi ke server reader
  ws = new WebSocket('ws://localhost:8765');

  // Terhubung
  ws.onopen = () => console.log('[Reader WS] Connected');

  // Jika terputus, coba reconnect
  ws.onclose = () => {
    console.log('[Reader WS] Disconnected, retrying in 3s...');
    setTimeout(connectReader, RECONNECT_INTERVAL);
  };

  ws.onerror = (err) => console.error('[Reader WS] Error', err);

  // Pesan masuk dari reader: parsing dan ambil field id sebagai UID
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data.replace(/'/g, '"'));
      if (scanCallback) scanCallback(data.id);
    } catch (e) {
      console.error('[Reader WS] Invalid data', e);
    }
  };
};

// Tutup koneksi dan bersihkan callback
export const disconnectReader = () => {
  ws?.close();
  ws = null;
  scanCallback = null;
};

export const onReaderScan = (callback: (uid: string) => void) => {
  scanCallback = callback;
};

export const startScan = async (cb: (uid: string) => void) => {
  onReaderScan(cb);
  connectReader();
};

// Hentikan scan dan tutup koneksi
export const stopScan = async () => {
  disconnectReader();
};
