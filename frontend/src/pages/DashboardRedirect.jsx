import React from 'react';
import { useSelector } from 'react-redux';
import AdminDashboard from './admin/AdminDashboard';
import MentorDashboard from './mentor/MentorDashboard';
import MenteeDashboard from './mentee/MenteeDashboard';
import { Typography, Container, Box } from '@mui/material';

const DashboardRedirect = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading user profile...</Typography>
        </Box>
      </Container>
    );
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MENTOR':
      return <MentorDashboard />;
    case 'MENTEE':
      return <MenteeDashboard />;
    default:
      return (
        <Container>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography color="error">Error: Invalid User Role.</Typography>
          </Box>
        </Container>
      );
  }
};

export default DashboardRedirect;
