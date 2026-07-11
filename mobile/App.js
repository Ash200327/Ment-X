import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: '#6366f1', // Indigo Accent
    secondary: '#10b981', // Emerald Accent
    background: '#f8fafc', // Slate 50 (Very light gray-blue)
    surface: '#ffffff', // White panels
    surfaceVariant: '#f1f5f9', // Slate 100
    onBackground: '#0f172a', // Slate 900 (Dark text)
    onSurface: '#0f172a',
    onSurfaceVariant: '#64748b', // Slate 500
    outline: '#e2e8f0', // Slate 200 (Divider/border)
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
  },
  fonts: MD3LightTheme.fonts,
};

const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: '#6366f1', // Indigo Accent
    secondary: '#10b981', // Emerald Accent
    background: '#0b0f19', // Deep dark slate background
    surface: '#111827', // Slate secondary panel
    surfaceVariant: '#1f2937', // Slightly lighter slate
    onBackground: '#f3f4f6', // Light gray text
    onSurface: '#f3f4f6',
    onSurfaceVariant: '#9ca3af', // Slate secondary text
    outline: '#1f2937', // Divider/border
    card: '#111827',
    text: '#f3f4f6',
    border: '#1f2937',
  },
  fonts: MD3DarkTheme.fonts,
};

function AppContent() {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <AppNavigator theme={theme} />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ReduxProvider>
  );
}
