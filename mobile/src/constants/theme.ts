import { Platform } from 'react-native';

export const colors = {
  ink: '#17182F',
  forest: '#7557A6',
  forestDark: '#21172F',
  mint: '#D9C8FF',
  mintPale: '#F1EBFF',
  sage: '#E6DDF7',
  cream: '#F7F2EA',
  paper: '#FFFDFB',
  orange: '#FF5F7E',
  orangeDark: '#B92F57',
  peach: '#FFE2EA',
  yellow: '#F2CA62',
  text: '#29293F',
  muted: '#696579',
  line: '#E2DCEC',
  white: '#FFFFFF',
  danger: '#A52B25',
  success: '#6850A2',
  black: '#000000',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 44 } as const;
export const radius = { xs: 8, sm: 12, md: 18, lg: 28, pill: 999 } as const;

export const typography = {
  display: Platform.select({ ios: 'Iowan Old Style', android: 'serif', default: 'Georgia' }),
  body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'system-ui' }),
  label: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const shadow = {
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 3,
} as const;
