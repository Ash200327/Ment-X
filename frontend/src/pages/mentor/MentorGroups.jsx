import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent, Button, TextField, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, Select, FormControl, InputLabel, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import axiosInstance from '../../api/axiosInstance';

const MentorGroups = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [allMentees, setAllMentees] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState('');
  
  // Group creation form
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/groups');
      setGroups(res.data);
      if (res.data.length > 0 && !activeGroup) {
        handleSelectGroup(res.data[0]);
      }
    } catch (e) {
      setError("Failed to fetch groups.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMentees = async () => {
    try {
      const res = await axiosInstance.get('/api/auth/mentees');
      setAllMentees(res.data);
    } catch (e) {
      console.error("Failed to load mentees list", e);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchMentees();
  }, []);

  const handleSelectGroup = async (group) => {
    setActiveGroup(group);
    try {
      const res = await axiosInstance.get(`/api/groups/${group.id}/members`);
      setMembers(res.data);
    } catch (e) {
      setError("Failed to fetch group members.");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await axiosInstance.post('/api/groups', { groupName, description });
      setSuccess(`Group "${res.data.groupName}" created successfully.`);
      setGroupName('');
      setDescription('');
      fetchGroups();
      handleSelectGroup(res.data);
    } catch (e) {
      setError("Failed to create group.");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group? All memberships will be removed.")) {
      try {
        await axiosInstance.delete(`/api/groups/${groupId}`);
        setSuccess("Group deleted successfully.");
        setActiveGroup(null);
        setMembers([]);
        fetchGroups();
      } catch (e) {
        setError("Failed to delete group.");
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedMentee) return;
    setError('');
    setSuccess('');
    try {
      await axiosInstance.post(`/api/groups/${activeGroup.id}/members/${selectedMentee}`);
      setSuccess("Member added to group.");
      setSelectedMentee('');
      handleSelectGroup(activeGroup);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member.");
    }
  };

  const handleRemoveMember = async (menteeId) => {
    if (window.confirm("Remove this member from the group?")) {
      setError('');
      setSuccess('');
      try {
        await axiosInstance.delete(`/api/groups/${activeGroup.id}/members/${menteeId}`);
        setSuccess("Member removed from group.");
        handleSelectGroup(activeGroup);
      } catch (e) {
        setError("Failed to remove member.");
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Manage Groups & Members
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Sidebar: Groups list & creation */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                My Groups
              </Typography>
              {groups.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No groups created yet.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {groups.map((group) => (
                    <Button
                      key={group.id}
                      variant={activeGroup?.id === group.id ? "contained" : "outlined"}
                      fullWidth
                      onClick={() => handleSelectGroup(group)}
                      sx={{ justifyContent: 'space-between', py: 1.2 }}
                    >
                      <span>{group.groupName}</span>
                      <IconButton
                        size="small"
                        color={activeGroup?.id === group.id ? "inherit" : "error"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Button>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Create New Group
              </Typography>
              <form onSubmit={handleCreateGroup}>
                <TextField
                  label="Group Name"
                  fullWidth
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={<GroupAddIcon />}
                >
                  Create Group
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Members Management panel */}
        <Grid item xs={12} md={8}>
          {activeGroup ? (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ borderBottom: '1px solid #1f2937', pb: 2, mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {activeGroup.groupName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {activeGroup.description || 'No description provided'}
                  </Typography>
                </Box>

                {/* Add member form */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'flex-end' }}>
                  <FormControl fullWidth>
                    <InputLabel id="add-mentee-label">Select Mentee to Add</InputLabel>
                    <Select
                      labelId="add-mentee-label"
                      value={selectedMentee}
                      label="Select Mentee to Add"
                      onChange={(e) => setSelectedMentee(e.target.value)}
                    >
                      <MenuItem value="" disabled>Select a Mentee</MenuItem>
                      {allMentees
                        .filter(m => !members.some(mem => mem.id === m.id))
                        .map((mentee) => (
                          <MenuItem key={mentee.id} value={mentee.id}>
                            {mentee.name} ({mentee.email})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={handleAddMember}
                    disabled={!selectedMentee}
                    sx={{ height: 56, px: 3 }}
                  >
                    Add
                  </Button>
                </Box>

                {/* Members list */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Group Members ({members.length})
                </Typography>

                <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary" variant="body2">No members in this group yet.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <Typography color="text.secondary">Select or create a group to manage members</Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default MentorGroups;
