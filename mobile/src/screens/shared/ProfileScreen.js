import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Avatar, useTheme, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, updateProfileSuccess } from '../../store/authSlice';
import axiosInstance, { baseURL } from '../../api/axiosInstance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(user?.hasProfilePicture ? `${baseURL}/api/users/${user.id}/avatar` : '');
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarColor, setSnackbarColor] = useState(theme.colors.primary);

  const showSnackbar = (message, isError = false) => {
    setSnackbarMessage(message);
    setSnackbarColor(isError ? theme.colors.error : '#10b981');
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showSnackbar("Permission to access camera roll is required!", true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // Request base64 to match web frontend's FileReader logic
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // Format as data URL just like web frontend
      const dataUrl = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
      setProfilePicture(dataUrl);
    }
  };

  const handleSubmit = async () => {
    if (password && password !== confirmPassword) {
      showSnackbar("Passwords do not match", true);
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.put('/api/auth/profile', {
        name,
        newPassword: password || null,
        profilePicture: (profilePicture && profilePicture.startsWith('data:')) ? profilePicture : null
      });
      dispatch(updateProfileSuccess(response.data));
      showSnackbar("Profile updated successfully!");
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update profile.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileCardContent}>
            <View style={styles.avatarContainer}>
              {profilePicture ? (
                <Avatar.Image size={100} source={{ uri: profilePicture }} style={styles.avatar} />
              ) : (
                <Avatar.Text 
                  size={100} 
                  label={name?.substring(0, 2).toUpperCase() || 'U'} 
                  style={styles.avatarTextOnly} 
                />
              )}
              <TouchableOpacity style={styles.cameraIconContainer} onPress={pickImage}>
                <MaterialCommunityIcons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text variant="titleLarge" style={styles.userName}>{user?.name}</Text>
            <Text variant="bodyMedium" style={styles.userEmail}>{user?.email}</Text>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#818cf8' }]}>ROLE: {user?.role}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#34d399' }]}>STATUS: {user?.status}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Update Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.formTitle}>Update Account Information</Text>
            
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Email Address"
              value={user?.email || ''}
              mode="outlined"
              disabled
              style={styles.input}
            />
            
            <TextInput
              label="New Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              placeholder="Leave blank to keep current"
              style={styles.input}
            />
            
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              placeholder="Leave blank to keep current"
              style={styles.input}
            />

            <Button 
              mode="contained" 
              onPress={handleSubmit} 
              style={styles.submitButton}
              disabled={loading}
              loading={loading}
            >
              Save Changes
            </Button>
          </Card.Content>
        </Card>

        <Button 
          mode="outlined" 
          icon="logout"
          onPress={handleLogout} 
          textColor={theme.colors.error}
          style={{ borderColor: theme.colors.error, marginTop: 10 }}
        >
          Log Out
        </Button>

      </ScrollView>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        style={{ backgroundColor: snackbarColor }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  profileCardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: 'transparent',
  },
  avatarTextOnly: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#374151',
    borderRadius: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    marginBottom: 16,
    opacity: 0.7,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  formCard: {
    borderRadius: 12,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 6,
  }
});

export default ProfileScreen;
