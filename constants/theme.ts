// TRIPX Design System — Dark professional, taxi gold accent
export const Colors = {
  // Base
  background: '#080C1A',
  surface: '#111827',
  surfaceElevated: '#1A2235',
  surfaceHigh: '#212D42',
  border: '#1E2D45',
  borderLight: '#253350',

  // Brand
  primary: '#F5C518',
  primaryDark: '#D4A800',
  primaryMuted: 'rgba(245, 197, 24, 0.12)',
  primaryBorder: 'rgba(245, 197, 24, 0.25)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8899BB',
  textMuted: '#4E617A',
  textInverse: '#080C1A',

  // Semantic
  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.12)',

  // Status colors for booking states
  stateActive: '#F5C518',
  stateCompleted: '#22C55E',
  statePending: '#3B82F6',
  stateCancelled: '#EF4444',
  stateInactive: '#4E617A',

  // Overlays
  overlay: 'rgba(8, 12, 26, 0.85)',
  overlayLight: 'rgba(8, 12, 26, 0.5)',
};

export const Typography = {
  // Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gold: {
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
