import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import axiosInstance from '../../api/axiosConfig';
import { GlassView } from 'expo-glass-effect';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Assuming role selection could be added here, defaulting to MENTEE
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/register', { 
        name, 
        email, 
        password, 
        role: 'MENTEE' 
      });
      
      Alert.alert('Success', 'Registration successful! Pending admin approval.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.log(error);
      Alert.alert('Registration Failed', error.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlassView style={styles.glassCard}>
        <Text variant="headlineMedium" style={styles.title}>Register for Ment-X</Text>
        
        <TextInput
          label="Full Name"
          mode="outlined"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

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
        
        <TextInput
          label="Confirm Password"
          mode="outlined"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry={!showConfirmPassword}
          right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => {
            setShowConfirmPassword(true);
            setTimeout(() => setShowConfirmPassword(false), 1500);
          }} />}
        />
        
        <Button 
          mode="contained" 
          onPress={handleRegister} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Register
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ marginTop: 15, color: theme.colors.primary, textAlign: 'center' }}>
            Already have an account? Login
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
    backgroundColor: '#0a0a0a',
  },
  glassCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
