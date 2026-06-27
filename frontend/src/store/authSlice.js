import { createSlice } from '@reduxjs/toolkit';

// Retrieve initial state from local storage
const token = localStorage.getItem('token');
const userJson = localStorage.getItem('user');
let user = null;
try {
  user = userJson ? JSON.parse(userJson) : null;
} catch (e) {
  console.error("Failed to parse user data from localStorage", e);
}

const initialState = {
  token: token || null,
  user: user || null,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { token, ...userData } = action.payload;
      state.token = token;
      state.user = userData;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateProfileSuccess: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
});

export const { loginSuccess, logout, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
