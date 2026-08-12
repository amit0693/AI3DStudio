export const colors = {
  ink: '#103D36',
  forest: '#1B6253',
  forestDark: '#0B2E29',
  mint: '#ACE7D1',
  mintPale: '#E8F8F1',
  sage: '#D7E9DA',
  cream: '#F7F3EA',
  paper: '#FFFEFA',
  orange: '#EF6841',
  orangeDark: '#B93D20',
  peach: '#FFE2D7',
  yellow: '#F2CA62',
  text: '#173630',
  muted: '#61736D',
  line: '#D9E0DB',
  white: '#FFFFFF',
  danger: '#A52B25',
  success: '#176B4B',
  black: '#000000',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 44 } as const;
export const radius = { xs: 8, sm: 12, md: 18, lg: 28, pill: 999 } as const;

export const shadow = {
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 3,
} as const;
