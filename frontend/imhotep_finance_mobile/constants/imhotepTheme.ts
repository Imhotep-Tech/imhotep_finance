import { TextStyle, ViewStyle } from 'react-native';

/**
 * Imhotep Finance High-End Theme Architecture
 * Archetype A: Sleek Glassmorphism (Deep Obsidian Slate & Semi-transparent Glass)
 * Archetype B: Modern Bento Grid (Precise Inset Borders & Glowing Ambient Accents)
 */

export const ImhotepTheme = {
  colors: {
    // Backgrounds
    backgroundDark: '#070A11',
    backgroundSurface: '#0B0F19',
    
    // Glass Surface Tokens
    glassCard: 'rgba(15, 23, 42, 0.70)',
    glassCardHover: 'rgba(30, 41, 59, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.09)',
    glassBorderActive: 'rgba(56, 189, 248, 0.35)',
    
    // Brand & Ambient Glowing Accents
    primaryTeal: '#0D9488',
    primaryTealGlow: '#14B8A6',
    primaryTealLight: 'rgba(20, 184, 166, 0.15)',
    
    accentGold: '#D97706',
    accentGoldGlow: '#F59E0B',
    accentGoldLight: 'rgba(245, 158, 11, 0.15)',
    
    depositGreen: '#10B981',
    depositGreenLight: 'rgba(16, 185, 129, 0.15)',
    
    withdrawRed: '#EF4444',
    withdrawRedLight: 'rgba(239, 68, 68, 0.15)',

    // Text & Hierarchy
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#070A11',
    
    // Interactive & Inputs
    inputBackground: 'rgba(30, 41, 59, 0.60)',
    inputBorder: 'rgba(148, 163, 184, 0.20)',
    chipBackground: 'rgba(30, 41, 59, 0.70)',
    chipActive: 'rgba(13, 148, 136, 0.25)',
  },

  // Minimum Touch Target Guideline (44x44 dp)
  touchTarget: {
    minWidth: 44,
    minHeight: 44,
  },

  // Inset Shadows & Glass Cards Style Helpers
  glassCardStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 20,
  } as ViewStyle,

  bentoGridStyle: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
  } as ViewStyle,
};

export default ImhotepTheme;
