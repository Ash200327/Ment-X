import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode to match website

  useEffect(() => {
    // Load persisted theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('user_theme_preference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Fallback to system default if no saved preference
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (e) {
        console.log('Error loading theme preference:', e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('user_theme_preference', newMode ? 'dark' : 'light');
    } catch (e) {
      console.log('Error saving theme preference:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
