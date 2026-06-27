import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, TextField, Button, Box, Alert, CircularProgress, Link, ToggleButtonGroup, ToggleButton, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('MENTEE'); // Default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => {
      setShowPassword(false);
    }, 1500);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(true);
    setTimeout(() => {
      setShowConfirmPassword(false);
    }, 1500);
  };

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      await axiosInstance.post('/api/auth/register', { name, email, password, role });
      setSuccess(true);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 1) 90.2%)',
      p: 2
    }}>
      <Container maxWidth="xs">
        <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(17, 24, 39, 0.95)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #34d399 30%, #818cf8 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join the Ment-X Performance Platform
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {success ? (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Registration Submitted!</Typography>
                  Your account is now <strong>Pending Admin Verification</strong>. Once verified, you will be able to log in.
                </Alert>
                <Button variant="contained" fullWidth onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, alignSelf: 'flex-start' }}>
                    I want to register as a:
                  </Typography>
                  <ToggleButtonGroup
                    value={role}
                    exclusive
                    onChange={handleRoleChange}
                    color="secondary"
                    fullWidth
                  >
                    <ToggleButton value="MENTEE" sx={{ py: 1 }}>
                      Mentee
                    </ToggleButton>
                    <ToggleButton value="MENTOR" sx={{ py: 1 }}>
                      Mentor
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <TextField
                  label="Full Name"
                  type="text"
                  fullWidth
                  required
                  variant="outlined"
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' } } }}
                />

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' } } }}
                />
                
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleShowPassword} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' } } }}
                />

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  variant="outlined"
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleShowConfirmPassword} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' } } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                </Button>
              </form>
            )}

            {!success && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link href="/login" sx={{ color: '#34d399', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Log in
                  </Link>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
