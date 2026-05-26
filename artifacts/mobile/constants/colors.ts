const colors = {
  dark: {
    background: '#0A0A0F',
    surface: '#111118',
    surfaceElevated: '#1A1A26',
    card: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.08)',

    primary: '#39FF7E',
    primaryDim: 'rgba(57,255,126,0.12)',
    primaryGlow: 'rgba(57,255,126,0.35)',

    text: '#FFFFFF',
    textSecondary: '#9A9AB0',
    textMuted: '#3A3A55',

    dotCurrent: '#39FF7E',
    dotCompleted: '#FFFFFF',
    dotPartial: 'rgba(57,255,126,0.4)',
    dotFuture: 'rgba(255,255,255,0.10)',
    dotMissed: 'rgba(255,255,255,0.03)',

    destructive: '#FF4455',
    warning: '#FFAA33',
    border: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.06)',

    // Legacy aliases
    tint: '#39FF7E',
    tabIconDefault: '#3A3A55',
    tabIconSelected: '#39FF7E',
    foreground: '#FFFFFF',
    cardForeground: '#FFFFFF',
    primaryForeground: '#0A0A0F',
    secondary: '#1A1A26',
    secondaryForeground: '#FFFFFF',
    muted: '#1A1A26',
    mutedForeground: '#9A9AB0',
    accent: '#1A1A26',
    accentForeground: '#FFFFFF',
    destructiveForeground: '#FFFFFF',
    input: 'rgba(255,255,255,0.08)',
  },
  light: {
    background: '#F8F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F0F8',
    card: 'rgba(0,0,0,0.03)',
    cardBorder: 'rgba(0,0,0,0.06)',

    primary: '#22C55E',
    primaryDim: 'rgba(34,197,94,0.12)',
    primaryGlow: 'rgba(34,197,94,0.3)',

    text: '#0A0A0F',
    textSecondary: '#6B6B80',
    textMuted: '#AAAAB8',

    dotCurrent: '#22C55E',
    dotCompleted: '#0A0A0F',
    dotPartial: 'rgba(34,197,94,0.5)',
    dotFuture: 'rgba(0,0,0,0.10)',
    dotMissed: 'rgba(0,0,0,0.04)',

    destructive: '#EF4444',
    warning: '#F59E0B',
    border: 'rgba(0,0,0,0.08)',
    inputBg: 'rgba(0,0,0,0.04)',

    tint: '#22C55E',
    tabIconDefault: '#AAAAB8',
    tabIconSelected: '#22C55E',
    foreground: '#0A0A0F',
    cardForeground: '#0A0A0F',
    primaryForeground: '#FFFFFF',
    secondary: '#F0F0F8',
    secondaryForeground: '#0A0A0F',
    muted: '#F0F0F8',
    mutedForeground: '#6B6B80',
    accent: '#F0F0F8',
    accentForeground: '#0A0A0F',
    destructiveForeground: '#FFFFFF',
    input: 'rgba(0,0,0,0.08)',
  },
  radius: 16,
};

export default colors;
