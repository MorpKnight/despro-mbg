// Optional: export Tailwind color tokens for JS usage where className isn't available
export const Colors = {
  primary: '#4CAF50',
  secondary: '#1976D2',
  accentYellow: '#FBC02D',
  accentRed: '#E53935',
  neutralWhite: '#FFFFFF',
  neutralGray: '#F5F5F5',
} as const;

export type ColorKey = keyof typeof Colors;
