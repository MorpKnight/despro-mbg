import React from 'react';
import { Text, View, ViewProps } from 'react-native';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info';

const toneMap: Record<StatusTone, { bg: string; text: string }> = {
  success: { bg: '#DCFCE7', text: '#166534' },
  warning: { bg: '#FEF9C3', text: '#92400E' },
  danger: { bg: '#FEE2E2', text: '#991B1B' },
  info: { bg: '#DBEAFE', text: '#1D4ED8' },
};

interface StatusPillProps extends ViewProps {
  label: string;
  tone?: StatusTone;
}

export const StatusPill = React.memo(function StatusPill({ label, tone = 'info', style, className = '', ...rest }: StatusPillProps & { className?: string }) {
  const colors = toneMap[tone];
  return (
    <View
      className={`px-3 py-1 rounded-full ${className}`}
      style={[{ backgroundColor: colors.bg }, style as any]}
      {...rest}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
});
