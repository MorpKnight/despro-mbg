import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

interface Props {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = '#111827' }: Props) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default React.memo(Icon);
