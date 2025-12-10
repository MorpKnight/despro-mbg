import { Platform } from "react-native";

// sumber scan yang sudah kamu pakai
export type NFCSource = "device" | "reader";

type OnUid = (uid: string) => void;

// simpan handler stop aktif
let currentStop: null | (() => Promise<void> | void) = null;

/**
 * Start scanning sesuai mode.
 * - device: gunakan implementasi NFC device yg sudah ada di project kamu
 * - reader: gunakan Electron (web) via window.nfcAPI
 */
export async function startScan(source: NFCSource, onUid: OnUid) {
  // selalu stop sebelumnya biar gak dobel listener
  await stopScan();

  if (source === "reader") {
    currentStop = startElectronReaderScan(onUid);
    return;
  }

  // === source === "device" ===
  // TODO: ganti ini dengan implementasi NFC device kamu yang sudah ada
  // Contoh placeholder:
  currentStop = await startDeviceScan(onUid);
}

/**
 * Stop scanning aktif (jika ada).
 */
export async function stopScan() {
  if (currentStop) {
    try {
      await currentStop();
    } finally {
      currentStop = null;
    }
  }
}

/* =========================
   Reader (Electron Web)
   ========================= */

function startElectronReaderScan(onUid: OnUid) {
  if (Platform.OS !== "web") {
    console.warn("[NFC] Reader mode hanya tersedia di web/Electron.");
    return () => {};
  }

  if (typeof window === "undefined" || !window.nfcAPI) {
    console.warn("[NFC] window.nfcAPI tidak tersedia. Pastikan app dijalankan via Electron.");
    return () => {};
  }

  let active = true;

  // Kita buat wrapper callback supaya bisa "soft stop"
  const handler = (data: NfcScanPayload) => {
    if (!active) return;
    const uid = data?.uid;
    if (uid) onUid(uid);
  };

  window.nfcAPI.onScan(handler);

  // Kita tidak punya removeListener dari preload,
  // jadi stop di sini sifatnya "soft stop"
  return () => {
    active = false;
  };
}

/* =========================
   Device NFC (existing)
   ========================= */

/**
 * Placeholder untuk NFC device.
 * Ganti isi fungsi ini dengan implementasi asli kamu
 * (mis. expo-nfc, react-native-nfc-manager, dll).
 */
async function startDeviceScan(onUid: OnUid) {
  // Jika kamu sudah punya implementasi sebelumnya,
  // pindahkan logic lama kamu ke sini.

  // Contoh dummy no-op:
  console.warn("[NFC] startDeviceScan belum dihubungkan di contoh ini.");
  return () => {};
}
