import React from 'react';
import { Text, View, ViewProps } from 'react-native';

interface OfflineBadgeProps extends ViewProps {
  isOnline: boolean;
  message?: string;
  className?: string;
}

export function OfflineBadge({ isOnline, message, style, className = '', ...rest }: OfflineBadgeProps) {
  if (isOnline) return null;
  return (
    <View
      className={`flex-row items-center gap-2 bg-amber-100 border border-amber-300 rounded-xl px-3 py-2 ${className}`}
      style={style as any}
      {...rest}
    >
      <Text className="text-amber-700 text-sm font-semibold">Offline</Text>
      <Text className="text-amber-700 text-xs flex-1">
        {message ?? 'Perubahan akan diantrikan dan dikirim saat koneksi kembali.'}
      </Text>
    </View>
  );
}
