import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreToken: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.token;
      state.isLoading = false;
    },
    loginSuccess: (state, action) => {
      const { token, ...userData } = action.payload;
      state.token = token;
      state.user = userData;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    updateProfileSuccess: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
});

export const { loginSuccess, logout, updateProfileSuccess, restoreToken } = authSlice.actions;

// Thunks for async storage
export const login = (token, userData) => async (dispatch) => {
  try {
    await AsyncStorage.setItem('token', token);
    if (userData) {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } else {
      await AsyncStorage.removeItem('user');
    }
    dispatch(loginSuccess({ token, ...userData }));
  } catch (error) {
    console.error('Error storing auth data', error);
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    dispatch(logout());
  } catch (error) {
    console.error('Error removing auth data', error);
  }
};

export const loadApp = () => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userJson = await AsyncStorage.getItem('user');
    let user = null;
    if (userJson) {
      user = JSON.parse(userJson);
    }
    dispatch(restoreToken({ token, user }));
  } catch (error) {
    console.error('Error loading auth data', error);
    dispatch(restoreToken({ token: null, user: null }));
  }
};

export default authSlice.reducer;
