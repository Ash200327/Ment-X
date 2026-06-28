import React, { useEffect, useState } from 'react';
import { Container, Typography, Card, CardContent, Grid, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axiosInstance from '../../api/axiosInstance';

const AdminGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/groups/all');
      setGroups(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        Group Administrations
      </Typography>

      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Mentor Name</TableCell>
              <TableCell>Mentor Email</TableCell>
              <TableCell align="center">Created Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Loading groups...</Typography>
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No groups have been created yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                  <TableCell sx={{ fontWeight: 700 }}>{group.groupName}</TableCell>
                  <TableCell>{group.description || 'No description provided'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{group.mentor?.name}</TableCell>
                  <TableCell>{group.mentor?.email}</TableCell>
                  <TableCell align="center">
                    {new Date(group.createdAt).toLocaleDateString()}
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

export default AdminGroups;
