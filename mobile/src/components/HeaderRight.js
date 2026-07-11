import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useThemeMode } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

const HeaderRight = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <View style={styles.container}>
      <IconButton
        icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
        size={22}
        onPress={toggleTheme}
        style={styles.iconButton}
      />
      <NotificationBell />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  iconButton: {
    margin: 0,
    marginRight: -4,
  },
});

export default HeaderRight;
