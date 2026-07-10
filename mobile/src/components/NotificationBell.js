import React, { useEffect, useState, useCallback } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { IconButton, Badge, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';

export default function NotificationBell() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);
  const scaleValue = new Animated.Value(1);

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosInstance.get('/api/notifications');
      const unread = res.data.filter(n => !n.readStatus).length;
      setUnreadCount(unread);
    } catch (e) {
      console.log('Failed to fetch notifications for bell', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    let animation;
    if (unreadCount > 0) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.delay(1000)
        ])
      );
      animation.start();
    } else {
      scaleValue.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [unreadCount]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <IconButton 
          icon={unreadCount > 0 ? "bell-ring" : "bell"} 
          iconColor={unreadCount > 0 ? '#ef4444' : theme.colors.primary} 
          onPress={() => navigation.navigate('Notifications')} 
        />
        {unreadCount > 0 && (
          <Badge size={18} style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 5,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    fontWeight: 'bold',
  }
});
