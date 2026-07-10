import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice';
import axiosInstance from '../../api/axiosConfig';
import { GlassView } from 'expo-glass-effect'; // assuming this is a wrapper component provided by the lib

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Adjusted to use local API
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      
      const { token, ...userData } = response.data;
      // Dispatch action to Redux and AsyncStorage
      dispatch(login(token, userData));
    } catch (error) {
      console.log(error);
      let errorMessage = 'Invalid credentials';
      if (!error.response) {
        errorMessage = 'Network Error: Cannot reach the server. Is your backend running and accessible?';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlassView style={styles.glassCard}>
        <Text variant="headlineMedium" style={styles.title}>Ment-X Login</Text>
        
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry={!showPassword}
          right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => {
            setShowPassword(true);
            setTimeout(() => setShowPassword(false), 1500);
          }} />}
        />
        
        <Button 
          mode="contained" 
          onPress={handleLogin} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={{ marginTop: 15, color: theme.colors.primary, textAlign: 'center' }}>
            Don{"'"}t have an account? Register
          </Text>
        </TouchableOpacity>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a', // Dark theme background
  },
  glassCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  }
});
