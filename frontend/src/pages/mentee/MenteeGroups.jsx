import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent, Box, Avatar, Divider, Chip, Paper, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useSelector } from 'react-redux';
import axiosInstance, { baseURL } from '../../api/axiosInstance';

const MenteeGroups = () => {
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/groups/my-groups');
      setGroups(res.data);
    } catch (e) {
      setError("Failed to fetch group details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGroups();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        My Group Associations
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Typography color="text.secondary">Loading your group information...</Typography>
      ) : groups.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', border: '1px solid #1f2937' }}>
          <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
            No Group Associations Found
          </Typography>
          <Typography color="text.secondary" variant="body2">
            You haven't been added to any mentorship groups yet. Please contact your mentor or administrator.
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {groups.map((group) => (
            <Card key={group.id} sx={{ border: '1px solid #1f2937', borderRadius: 4, overflow: 'hidden' }}>
              {/* Group Header Banner */}
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #1e1b4b 0%, #111827 100%)', 
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f3f4f6' }}>
                    {group.groupName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {group.description || 'No description provided for this group.'}
                  </Typography>
                </Box>
                <Chip label="Mentorship Group" color="primary" sx={{ fontWeight: 700 }} />
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  {/* Mentor Details Section */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Group Mentor
                    </Typography>
                    
                    <Paper variant="outlined" sx={{ p: 3, borderColor: '#1f2937', bgcolor: 'rgba(0,0,0,0.1)' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                        <Avatar 
                          src={group.mentor?.hasProfilePicture ? `${baseURL}/api/users/${group.mentor.id}/avatar` : null} 
                          sx={{ width: 80, height: 80, bgcolor: '#6366f1', border: '2px solid #374151' }}
                        >
                          {group.mentor.name?.substring(0, 2).toUpperCase() || 'M'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {group.mentor.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Mentor-in-Charge
                          </Typography>
                        </Box>
                        <Divider sx={{ width: '100%' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', width: '100%', justifyContent: 'center' }}>
                          <MailOutlineIcon sx={{ fontSize: '1.1rem' }} />
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{group.mentor.email}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Members Details Section */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fellow Group Mentees
                    </Typography>

                    <Grid container spacing={2}>
                      {group.members.map((member) => (
                        <Grid item xs={12} sm={6} key={member.id}>
                          <Paper variant="outlined" sx={{ 
                            p: 2, 
                            borderColor: member.id === user.id ? '#10b981' : '#1f2937',
                            backgroundColor: member.id === user.id ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Avatar src={member.hasProfilePicture ? `${baseURL}/api/users/${member.id}/avatar` : null} sx={{ width: 44, height: 44, bgcolor: '#10b981' }}>
                              {member.name?.substring(0, 2).toUpperCase() || 'U'}
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.name} {member.id === user.id && <Typography component="span" variant="caption" sx={{ color: '#10b981', ml: 0.5 }}>(You)</Typography>}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.email}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default MenteeGroups;
