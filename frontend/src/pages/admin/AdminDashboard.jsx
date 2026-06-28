import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent, Box, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import axiosInstance from '../../api/axiosInstance';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await axiosInstance.get('/api/admin/stats');
      setStats(statsRes.data);
      const logsRes = await axiosInstance.get('/api/admin/audit-logs');
      setLogs(logsRes.data.slice(0, 10)); // Display the 10 most recent logs
    } catch (e) {
      setError("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statsCards = [
    { title: 'Active Mentors', value: stats?.totalMentors || 0, icon: <PeopleIcon sx={{ fontSize: '2.5rem', color: '#6366f1' }} /> },
    { title: 'Active Mentees', value: stats?.totalMentees || 0, icon: <PeopleIcon sx={{ fontSize: '2.5rem', color: '#10b981' }} /> },
    { title: 'Pending Approvals', value: stats?.pendingVerifications || 0, icon: <VerifiedUserIcon sx={{ fontSize: '2.5rem', color: '#f59e0b' }} />, highlight: (stats?.pendingVerifications > 0) },
    { title: 'Platform Groups', value: stats?.totalGroups || 0, icon: <GroupIcon sx={{ fontSize: '2.5rem', color: '#0ea5e9' }} /> },
    { title: 'Assigned Tasks', value: stats?.totalTasks || 0, icon: <AssignmentIcon sx={{ fontSize: '2.5rem', color: '#a855f7' }} /> },
  ];

  return (
    <Container maxWidth="xl" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statsCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card sx={{
              border: card.highlight ? '1px solid #f59e0b' : '1px solid #1f2937',
              backgroundColor: card.highlight ? 'rgba(245, 158, 11, 0.03)' : '#111827'
            }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{card.title}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{card.value}</Typography>
                </Box>
                {card.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Audit Logs Table */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon /> System Audit Logs
      </Typography>
      
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">Loading activity feed...</Typography>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No activities logged yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                  <TableCell color="text.secondary">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{log.username}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        backgroundColor: log.action.includes('CREATED') || log.action.includes('VERIFIED') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        color: log.action.includes('CREATED') || log.action.includes('VERIFIED') ? '#10b981' : '#f3f4f6'
                      }}
                    />
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminDashboard;
