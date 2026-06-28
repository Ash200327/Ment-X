import React, { useEffect, useState } from 'react';
import { Container, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Tabs, Tab, Alert, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import axiosInstance from '../../api/axiosInstance';

const UserVerifications = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0 = Pending, 1 = All Users
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = tabValue === 0 ? '/api/admin/pending-verifications' : '/api/admin/users';
      const res = await axiosInstance.get(url);
      setUsers(res.data);
    } catch (e) {
      setError("Failed to fetch user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tabValue]);

  const handleVerify = async (id) => {
    try {
      await axiosInstance.post(`/api/admin/verify/${id}`);
      setSuccess("User account approved successfully.");
      fetchUsers();
    } catch (e) {
      setError("Failed to approve user account.");
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this registration request?")) {
      try {
        await axiosInstance.post(`/api/admin/reject/${id}`);
        setSuccess("User account request rejected.");
        fetchUsers();
      } catch (e) {
        setError("Failed to reject request.");
      }
    }
  };

  const handleSuspend = async (id) => {
    if (window.confirm("Are you sure you want to suspend this user? they will be unable to log in.")) {
      try {
        await axiosInstance.post(`/api/admin/suspend/${id}`);
        setSuccess("User account has been suspended.");
        fetchUsers();
      } catch (e) {
        setError("Failed to suspend user.");
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await axiosInstance.post(`/api/admin/activate/${id}`);
      setSuccess("User account has been activated.");
      fetchUsers();
    } catch (e) {
      setError("Failed to activate user.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to delete this user permanently? This will remove all their records!")) {
      try {
        await axiosInstance.delete(`/api/admin/delete/${id}`);
        setSuccess("User account deleted permanently.");
        fetchUsers();
      } catch (e) {
        setError("Failed to delete user.");
      }
    }
  };

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return '#10b981'; // Green
    if (status === 'PENDING_VERIFICATION') return '#f59e0b'; // Amber
    if (status === 'REJECTED') return '#ef4444'; // Red
    return '#6b7280'; // Grey for suspended
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        User Account Management
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)} textColor="secondary" indicatorColor="secondary">
          <Tab label="Pending Approvals" />
          <Tab label="All Platform Users" />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Loading accounts...</Typography>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No accounts found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((row) => (
                <TableRow key={row.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell align="center">
                    <Chip label={row.role} size="small" variant="outlined" color={row.role === 'MENTOR' ? 'primary' : 'secondary'} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700, backgroundColor: `${getStatusColor(row.status)}22`, color: getStatusColor(row.status), border: `1px solid ${getStatusColor(row.status)}44` }}>
                      {row.status}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {row.status === 'PENDING_VERIFICATION' && (
                        <>
                          <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => handleVerify(row.id)}>
                            Approve
                          </Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => handleReject(row.id)}>
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {row.role !== 'ADMIN' && row.status === 'APPROVED' && (
                        <Button size="small" variant="outlined" color="warning" startIcon={<BlockIcon />} onClick={() => handleSuspend(row.id)}>
                          Suspend
                        </Button>
                      )}

                      {row.role !== 'ADMIN' && row.status === 'SUSPENDED' && (
                        <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => handleActivate(row.id)}>
                          Re-Activate
                        </Button>
                      )}

                      {row.role !== 'ADMIN' && (
                        <Button size="small" color="error" onClick={() => handleDelete(row.id)}>
                          <DeleteIcon />
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default UserVerifications;
