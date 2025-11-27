import { connectReader, disconnectReader, onReaderScan } from './externalReaderNFC';

export type NFCSource = 'device' | 'reader';

let currentSource: NFCSource | null = null;

// Start scanning NFC sesuai source
export const startScan = async (source: NFCSource, onScan: (uid: string) => void) => {
    currentSource = source;
    // Untuk sekarang, hanya external reader yang diimplementasikan
    connectReader();
    onReaderScan(onScan);
};

// Stop scanning NFC
export const stopScan = async () => {
    disconnectReader();
    currentSource = null;
};

