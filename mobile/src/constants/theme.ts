import { Platform } from 'react-native';

export const colors = {
  ink: '#202722',
  action: '#A8D5AF',
  actionDark: '#3F6F4B',
  charcoal: '#202722',
  ice: '#DDEEDD',
  icePale: '#F1F8F1',
  skyPale: '#E7F2E7',
  ceramic: '#F3F8F1',
  paper: '#FFFEFA',
  clay: '#E8906F',
  clayPale: '#FBEAE2',
  sand: '#F0D593',
  text: '#2B352F',
  muted: '#5F6C64',
  line: '#D9E5DA',
  white: '#FFFFFF',
  danger: '#A52B25',
  success: '#3F6F4B',
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
