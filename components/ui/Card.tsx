import React, { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';

export default function Card({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <View
      className="bg-neutral-white rounded-card shadow-card p-4"
      style={style as any}
      {...rest}
    >
      {children}
    </View>
  );
}
