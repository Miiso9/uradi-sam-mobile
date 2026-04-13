import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceRaised: string;
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  secondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  error: string;
  success: string;
  warning: string;
  cardShadow: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  pillActive: string;
  pillActiveFg: string;
}

export const darkColors: ThemeColors = {
  background: '#0C0D0F',
  backgroundElevated: '#111214',
  surface: '#151618',
  surfaceRaised: '#1C1E22',
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryMuted: 'rgba(245,158,11,0.12)',
  secondary: '#38BDF8',
  text: '#ECEDF0',
  textSecondary: '#6B7280',
  textMuted: '#3D4048',
  border: '#1E2025',
  borderStrong: '#2A2D34',
  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  cardShadow: '#000000',
  tabBar: '#111214',
  tabBarBorder: '#1E2025',
  inputBg: '#1C1E22',
  pillActive: '#F59E0B',
  pillActiveFg: '#0C0D0F',
};

export const lightColors: ThemeColors = {
  background: '#F5F6F8',
  backgroundElevated: '#ECEEF2',
  surface: '#FFFFFF',
  surfaceRaised: '#F8F9FB',
  primary: '#D97706',
  primaryDark: '#B45309',
  primaryMuted: 'rgba(217,119,6,0.10)',
  secondary: '#0EA5E9',
  text: '#0C0D0F',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E4E6EA',
  borderStrong: '#CBD0D8',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  cardShadow: '#00000018',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E4E6EA',
  inputBg: '#F0F1F5',
  pillActive: '#D97706',
  pillActiveFg: '#FFFFFF',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
    } else {
      setThemeState('dark');
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    await AsyncStorage.setItem('app-theme', mode);
  };

  const toggleTheme = () => {
    const newMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newMode);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{ theme, colors, toggleTheme, setTheme, isDark: theme === 'dark' }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
