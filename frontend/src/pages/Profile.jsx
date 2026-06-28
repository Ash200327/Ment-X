import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, TextField, Button, Box, Grid, Alert, CircularProgress, Avatar, IconButton } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileSuccess } from '../store/authSlice';
import axiosInstance from '../api/axiosInstance';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFileError('Image size must be less than 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFileError('Only image files are allowed.');
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axiosInstance.put('/api/auth/profile', {
        name,
        newPassword: password || null,
        profilePicture: profilePicture || null
      });
      dispatch(updateProfileSuccess(response.data));
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profilePicture}
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    border: '2px solid #1f2937'
                  }}
                >
                  {name?.substring(0, 2).toUpperCase() || 'U'}
                </Avatar>
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: -6,
                    right: -6,
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    '&:hover': { backgroundColor: '#374151' },
                    p: 0.8
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <PhotoCamera sx={{ fontSize: '1.1rem', color: '#818cf8' }} />
                </IconButton>
              </Box>
              
              {fileError && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {fileError}
                </Typography>
              )}

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Box sx={{ mt: 1, px: 2, py: 0.5, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', width: 'fit-content', fontSize: '0.8rem', fontWeight: 700 }}>
                ROLE: {user?.role}
              </Box>
              <Box sx={{ px: 2, py: 0.5, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', width: 'fit-content', fontSize: '0.8rem', fontWeight: 700 }}>
                STATUS: {user?.status}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Update Account Information</Typography>

              {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Email Address"
                      fullWidth
                      value={user?.email || ''}
                      disabled
                      helperText="Email address cannot be changed."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="New Password"
                      type="password"
                      fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      fullWidth
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
