import { Platform } from 'react-native';

export const colors = {
  ink: '#0C1B33',
  action: '#2457D6',
  actionDark: '#1B46B8',
  ocean: '#0C1B33',
  ice: '#DCEAFF',
  icePale: '#F3F7FF',
  skyPale: '#E7EFFA',
  ceramic: '#F5F8FF',
  paper: '#FFFDFC',
  clay: '#F29A76',
  clayPale: '#FFF0E9',
  sand: '#F3C86A',
  text: '#18253A',
  muted: '#5B6475',
  line: '#D8E1EE',
  white: '#FFFFFF',
  danger: '#A52B25',
  success: '#1B6E62',
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
