/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) return process.env.EXPO_PUBLIC_API_BASE_URL;
  if (Platform.OS === 'android') return 'https://mentx-backend.onrender.com';
  // Web and iOS simulator can just use localhost
  return 'https://mentx-backend.onrender.com';
};

const baseURL = getBaseUrl();

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to the Authorization header
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle expired sessions
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage if session expires
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // Navigation to login should ideally be handled at the root navigator level
        // listening to the auth state in Redux, rather than directly here.
      } catch (err) {
        console.error('Error removing auth items', err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
