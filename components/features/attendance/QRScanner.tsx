import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

type Props = {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: Error) => void;
  paused?: boolean; // pause scanning callbacks but keep camera running
  cameraEnabled?: boolean; // mount/unmount camera to truly stop hardware
  className?: string;
  style?: any;
};

export default function QRScanner({ onScanSuccess, onScanError, paused, cameraEnabled = true, className = '', style }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const scanningActive = cameraEnabled && !scanned && !paused;

  // Reset internal scanned state when parent unpauses
  React.useEffect(() => {
    if (!paused) {
      setScanned(false);
    }
  }, [paused]);

  const handleScan = useCallback(
    async (event: { data: string; type?: string }) => {
      if (!scanningActive) return;
      setScanned(true);
      try {
        // Simple validation: non-empty QR payload
        const data = String(event?.data ?? '').trim();
        if (!data) throw new Error('QR kosong');
        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        onScanSuccess(data);
      } catch (e: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
        onScanError?.(e instanceof Error ? e : new Error('Gagal memindai'));
        // Allow re-scan immediately on error
        setScanned(false);
      }
    },
    [onScanSuccess, onScanError, scanningActive]
  );

  const overlay = useMemo(() => (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {/* Dim background */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      {/* Center row with cutout */}
      <View style={{ height: 240, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <View style={{ width: 240, borderWidth: 3, borderColor: '#22d3ee', borderRadius: 12 }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      </View>
      {/* Bottom dim */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
    </View>
  ), []);

  if (!cameraEnabled) {
    return (
      <View className={`items-center justify-center bg-black/80 rounded-card ${className}`} style={[{ aspectRatio: 3 / 4 }, style]}>
        <Text className="text-white font-semibold">Kamera dimatikan</Text>
        <Text className="text-gray-300 mt-1">Nyalakan kamera untuk memindai QR</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View className={`items-center justify-center ${className}`} style={[{ height: 360 }, style]}>
        <ActivityIndicator />
        <Text className="mt-2 text-gray-600">Memeriksa izin kamera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className={`items-center justify-center p-4 bg-neutral-white rounded-card shadow-card ${className}`} style={style}>
        <Text className="text-lg font-bold text-gray-900">Izin Kamera Diperlukan</Text>
        <Text className="text-gray-600 mt-1 text-center">Aplikasi memerlukan akses kamera untuk memindai QR code.</Text>
        <Pressable
          accessibilityRole="button"
          className="mt-3 px-4 py-3 rounded-card bg-primary"
          onPress={() => requestPermission()}
        >
          <Text className="text-white font-semibold">Izinkan Kamera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={`overflow-hidden rounded-card ${className}`} style={[{ aspectRatio: 3 / 4, backgroundColor: '#000' }, style]}>
      {cameraEnabled && (
        <CameraView
          style={{ width: '100%', height: '100%' }}
          facing={facing}
          // @ts-ignore expo-camera newer API uses onBarcodeScanned
          onBarcodeScanned={scanningActive ? handleScan : undefined}
          // For older API compatibility, keep alias
          // @ts-ignore
          onBarCodeScanned={scanningActive ? handleScan : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] } as any}
          // @ts-ignore enable torch prop varies by version
          enableTorch={torch}
        />
      )}

      {cameraEnabled && overlay}

      {/* Controls overlay */}
      <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            className={`px-4 py-2 rounded-card ${scanned ? 'bg-secondary' : 'bg-gray-800/70'}`}
            onPress={() => setScanned(false)}
          >
            <Text className="text-white font-semibold">{scanned ? 'Scan Ulang' : 'Sedang Memindai…'}</Text>
          </Pressable>

          {cameraEnabled && Platform.OS !== 'web' && (
            <Pressable
              accessibilityRole="button"
              className={`px-4 py-2 rounded-card ${torch ? 'bg-amber-500' : 'bg-gray-800/70'}`}
              onPress={() => setTorch((t) => !t)}
            >
              <Text className="text-white font-semibold">{torch ? 'Matikan Senter' : 'Nyalakan Senter'}</Text>
            </Pressable>
          )}

          {cameraEnabled && (
            <Pressable
              accessibilityRole="button"
              className="px-4 py-2 rounded-card bg-gray-800/70 ml-2"
              onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            >
              <Text className="text-white font-semibold">
                {facing === 'back' ? 'Kamera Depan' : 'Kamera Belakang'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
