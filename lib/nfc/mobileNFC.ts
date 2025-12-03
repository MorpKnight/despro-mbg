/*import NfcManager, { NfcTech } from 'react-native-nfc-manager';

let scanning = false;

export const startScan = async (onScan: (uid: string, name?: string) => void) => {
  try {
    await NfcManager.start();
    scanning = true;

    await (NfcManager as any).registerTagEvent((tag: any) => {
      if (!scanning) return;
      const uid = tag.id ?? (tag.ndefMessage?.[0]?.payload ?? 'unknown');
      const name = tag.techTypes?.join(',') ?? undefined;
      onScan(uid, name);
    });
  } catch (err) {
    console.error('Gagal memulai NFC mobile', err);
  }
};

export const stopScan = async () => {
  try {
    scanning = false;
    await NfcManager.unregisterTagEvent();
  } catch (err) {
    // ignore
  }
};*/