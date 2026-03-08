import { ThemeMode } from '../types';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  cardSelected: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Accent colors (retro 50s pastel)
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  accentLight: string;
  
  // Status colors
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  
  // UI elements
  border: string;
  shadow: string;
  keyboard: string;
  keyboardText: string;
  keyboardPressed: string;
  
  // Operation colors
  addition: string;
  subtraction: string;
  multiplication: string;
  division: string;
}

// ============================================
// RETRO 50s THEME - Inspired by:
// - American diners
// - Pastel color palettes
// - Mid-century modern design
// - Jukebox aesthetics
// ============================================

export const lightTheme: ThemeColors = {
  // Background - warm cream like a 50s diner booth
  background: '#FEF9F3',      // Warm cream
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardSelected: '#E8F5E9',
  
  // Text - rich chocolate brown (50s typography feel)
  text: '#3D2914',            // Dark chocolate
  textSecondary: '#6D5D4B',   // Warm brown
  textMuted: '#A89F94',       // Muted taupe
  
  // Primary - Retro turquoise (classic 50s color)
  primary: '#40C4AA',         // Retro turquoise/mint
  primaryLight: '#9EE5D8',
  
  // Secondary - Coral pink (50s diner sign)
  secondary: '#FF7B7B',       // Coral/salmon pink
  secondaryLight: '#FFBDBD',
  
  // Accent - Butter yellow (jukebox gold)
  accent: '#FFD93D',          // Retro yellow
  accentLight: '#FFF2B3',
  
  // Status - keeping them functional but with retro tones
  success: '#5CB85C',         // Classic green
  successLight: '#D4EDDA',
  error: '#E74C3C',           // Cherry red
  errorLight: '#FADBD8',
  warning: '#F4A460',         // Sandy orange
  warningLight: '#FDEBD0',
  info: '#5DADE2',            // Sky blue
  infoLight: '#D6EAF8',
  
  // UI elements
  border: '#E8DDD4',          // Warm border
  shadow: 'rgba(61, 41, 20, 0.1)',
  keyboard: '#F5EDE5',        // Cream keyboard
  keyboardText: '#3D2914',
  keyboardPressed: '#E8DDD4',
  
  // Operation colors - bright retro pastels
  addition: '#7EC8E3',        // Baby blue
  subtraction: '#F9B4AB',     // Peach
  multiplication: '#C9B1FF',  // Lavender
  division: '#B5EAD7',        // Mint green
};

export const darkTheme: ThemeColors = {
  // Background - deep navy with 50s lounge vibe
  background: '#1B2838',      // Dark navy
  surface: '#243447',         // Slightly lighter navy
  card: '#2D4156',            // Card blue-gray
  cardSelected: '#2E5744',
  
  // Text - cream and warm tones
  text: '#FEF9F3',            // Warm cream
  textSecondary: '#C5B8AB',   // Muted tan
  textMuted: '#7A7168',       // Dark taupe
  
  // Primary - Neon turquoise (50s neon sign)
  primary: '#5EECC9',         // Bright mint/turquoise
  primaryLight: '#40C4AA',
  
  // Secondary - Neon pink (diner sign)
  secondary: '#FF9B9B',       // Bright coral
  secondaryLight: '#FF7B7B',
  
  // Accent - Electric yellow
  accent: '#FFE566',          // Bright yellow
  accentLight: '#FFD93D',
  
  // Status
  success: '#6FCF6F',
  successLight: '#5CB85C',
  error: '#FF6B6B',
  errorLight: '#E74C3C',
  warning: '#FFB366',
  warningLight: '#F4A460',
  info: '#7DC4E8',
  infoLight: '#5DADE2',
  
  // UI elements
  border: '#3D5067',
  shadow: 'rgba(0, 0, 0, 0.3)',
  keyboard: '#2D4156',
  keyboardText: '#FEF9F3',
  keyboardPressed: '#243447',
  
  // Operation colors - neon versions
  addition: '#7EC8E3',
  subtraction: '#FFB4AB',
  multiplication: '#D4B1FF',
  division: '#7EEAC1',
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Retro fonts recommendation (for app.json or custom fonts):
// - "Pacifico" - Script font for headings
// - "Bebas Neue" - Bold sans-serif
// - "Nunito" - Rounded friendly font
// - "Poppins" - Modern but retro-compatible

// Retro design patterns to use:
// 1. Rounded corners (12-20px border radius)
// 2. Soft drop shadows
// 3. Pastel gradients
// 4. Vintage iconography
// 5. Decorative borders and frames
