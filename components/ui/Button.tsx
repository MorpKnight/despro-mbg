import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary';

interface Props extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

export default function Button({ title, variant = 'primary', loading, disabled, style, className = '', ...rest }: Props) {
  const isSecondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`px-4 py-3 rounded-card flex-row items-center justify-center shadow-card ${
        isSecondary ? 'bg-secondary' : 'bg-primary'
      } ${disabled || loading ? 'opacity-60' : ''} ${className}`}
      style={style as any}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-neutral-white font-semibold text-body">{title}</Text>
      )}
    </Pressable>
  );
}
