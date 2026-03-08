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

export const lightTheme: ThemeColors = {
  // Background - soft cream/white like 50s diners
  background: '#FFF8F0',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardSelected: '#E8F5E9',
  
  // Text
  text: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  
  // Retro 50s pastel accent colors
  primary: '#7C4DFF', // Violet/purple
  primaryLight: '#B388FF',
  secondary: '#FF6B9D', // Soft pink
  secondaryLight: '#FFB3D1',
  accent: '#00D4AA', // Mint green
  accentLight: '#69F0AE',
  
  // Status
  success: '#00C853',
  successLight: '#B9F6CA',
  error: '#FF5252',
  errorLight: '#FFCDD2',
  warning: '#FFC107',
  warningLight: '#FFF9C4',
  info: '#2196F3',
  infoLight: '#BBDEFB',
  
  // UI elements
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  keyboard: '#F5F5F5',
  keyboardText: '#2D3436',
  keyboardPressed: '#E0E0E0',
  
  // Operation colors (pastel)
  addition: '#81D4FA', // Light blue
  subtraction: '#FFB74D', // Soft orange
  multiplication: '#CE93D8', // Light purple
  division: '#A5D6A7', // Light green
};

export const darkTheme: ThemeColors = {
  // Background - deep dark with warm undertones
  background: '#1A1A2E',
  surface: '#16213E',
  card: '#0F3460',
  cardSelected: '#1E5128',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textMuted: '#78909C',
  
  // Retro 50s pastel accent colors (brighter for dark mode)
  primary: '#B388FF',
  primaryLight: '#7C4DFF',
  secondary: '#FF8A80',
  secondaryLight: '#FF6B9D',
  accent: '#69F0AE',
  accentLight: '#00D4AA',
  
  // Status
  success: '#69F0AE',
  successLight: '#00C853',
  error: '#FF8A80',
  errorLight: '#FF5252',
  warning: '#FFD54F',
  warningLight: '#FFC107',
  info: '#64B5F6',
  infoLight: '#2196F3',
  
  // UI elements
  border: '#37474F',
  shadow: 'rgba(0, 0, 0, 0.3)',
  keyboard: '#0F3460',
  keyboardText: '#FFFFFF',
  keyboardPressed: '#16213E',
  
  // Operation colors (brighter for dark)
  addition: '#4FC3F7',
  subtraction: '#FFB74D',
  multiplication: '#BA68C8',
  division: '#81C784',
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
