import React, { PropsWithChildren } from 'react';
import { Pressable, View, ViewProps } from 'react-native';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  /** Make card pressable/interactive */
  onPress?: () => void;
}

export default function Card({
  children,
  variant = 'default',
  onPress,
  style,
  className = '',
  ...rest
}: PropsWithChildren<CardProps>) {

  let variantClass = 'bg-white shadow-md';

  switch (variant) {
    case 'elevated':
      variantClass = 'bg-white shadow-lg';
      break;
    case 'outlined':
      variantClass = 'bg-white border-2 border-gray-200';
      break;
    default:
      variantClass = 'bg-white shadow-md';
  }

  const content = (
    <View
      className={`rounded-xl p-4 ${variantClass} ${className}`}
      style={style as any}
      {...rest}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="active:opacity-90"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
