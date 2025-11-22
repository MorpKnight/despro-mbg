import React from 'react';
import { View, ViewProps } from 'react-native';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  rounded?: number;
  className?: string;
}

export default function Skeleton({ width = '100%', height = 16, rounded = 999, style, className = '', ...rest }: SkeletonProps) {
  return (
    <View
      className={`overflow-hidden bg-gray-200 ${className}`}
      style={[{ width, height, borderRadius: rounded }, style as any]}
      {...rest}
    />
  );
}
