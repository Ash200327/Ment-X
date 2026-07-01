import React, { useEffect, useState } from 'react';
import { Container, Card, CardContent, Typography, TextField, Button, Box, Grid, MenuItem, Select, FormControl, InputLabel, ToggleButtonGroup, ToggleButton, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axiosInstance from '../../api/axiosInstance';

const CreateTask = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  
  // Selection: "group" or "individual"
  const [assignType, setAssignType] = useState('group');
  const [groupId, setGroupId] = useState('');
  const [menteeId, setMenteeId] = useState('');

  const [groups, setGroups] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [mentorTasks, setMentorTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState(null);

  const fetchOptions = async () => {
    try {
      const groupsRes = await axiosInstance.get('/api/groups');
      setGroups(groupsRes.data);
      const menteesRes = await axiosInstance.get('/api/auth/mentees');
      setMentees(menteesRes.data);
    } catch (e) {
      console.error("Failed to load options", e);
    }
  };

  const fetchMentorTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await axiosInstance.get('/api/tasks/mentor');
      setMentorTasks(res.data);
    } catch (e) {
      console.error("Failed to load tasks list", e);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchMentorTasks();
  }, []);

  const formatDeadline = (dateStr) => {
    if (!dateStr) return '';
    try {
      const t = dateStr.split(/T|\s/);
      const d = t[0].split('-');
      const time = t[1] ? t[1].split(':') : [0, 0, 0];
      const date = new Date(
        parseInt(d[0]),
        parseInt(d[1]) - 1,
        parseInt(d[2]),
        parseInt(time[0]),
        parseInt(time[1]),
        time[2] ? parseInt(time[2]) : 0
      );
      return date.toLocaleString();
    } catch (e) {
      return new Date(dateStr).toLocaleString();
    }
  };

  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    if (isoString.includes('T')) {
      return isoString.slice(0, 16);
    }
    const date = new Date(isoString);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleEditClick = (task) => {
    setSuccess('');
    setError('');
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setWeekNumber(task.weekNumber);
    setDeadline(formatDatetimeLocal(task.deadline));
    setPriority(task.priority);
    
    // Assign type locking (since group/individual assignment structure is created, 
    // we only allow updating task content. Form displays target as locked info).
    if (task.group) {
      setAssignType('group');
      setGroupId(task.group.id);
    } else {
      setAssignType('individual');
      setMenteeId('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setWeekNumber(1);
    setDeadline('');
    setGroupId('');
    setMenteeId('');
    setSuccess('');
    setError('');
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task? This will delete all assignments, updates, reviews, and scores associated with it!")) {
      setError('');
      setSuccess('');
      try {
        await axiosInstance.delete(`/api/tasks/${taskId}`);
        setSuccess("Task deleted successfully.");
        if (editingTaskId === taskId) {
          handleCancelEdit();
        }
        fetchMentorTasks();
      } catch (e) {
        setError("Failed to delete task.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate selections
      if (!editingTaskId) {
        if (assignType === 'group' && !groupId) {
          throw new Error("Please select a group to assign the task.");
        }
        if (assignType === 'individual' && !menteeId) {
          throw new Error("Please select an individual mentee to assign the task.");
        }
      }

      const formattedDeadline = deadline ? deadline : null;

      const payload = {
        title,
        description,
        weekNumber: parseInt(weekNumber),
        deadline: formattedDeadline,
        priority,
        groupId: assignType === 'group' ? groupId : null,
        menteeId: assignType === 'individual' ? menteeId : null
      };

      if (editingTaskId) {
        await axiosInstance.put(`/api/tasks/${editingTaskId}`, payload);
        setSuccess("Task details updated successfully!");
        setEditingTaskId(null);
      } else {
        await axiosInstance.post('/api/tasks', payload);
        setSuccess("Task assigned successfully!");
      }

      // Reset form
      setTitle('');
      setDescription('');
      setWeekNumber(1);
      setDeadline('');
      setGroupId('');
      setMenteeId('');
      fetchMentorTasks();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p) => {
    if (p === 'HIGH') return 'error';
    if (p === 'MEDIUM') return 'warning';
    return 'info';
  };

  return (
    <Container maxWidth="xl" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Manage Tasks & Assignments
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Form Column */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: '1px solid #1f2937' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                {editingTaskId ? 'Edit Task Details' : 'Assign Weekly Task'}
              </Typography>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>
                  {/* Assignment Target (Locked during editing) */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Assign To: {editingTaskId && <Chip label="Locked during edit" size="small" color="secondary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                    </Typography>
                    <ToggleButtonGroup
                      value={assignType}
                      exclusive
                      onChange={(e, val) => val && !editingTaskId && setAssignType(val)}
                      color="primary"
                      fullWidth
                      disabled={!!editingTaskId}
                      sx={{ mb: 0.5 }}
                    >
                      <ToggleButton value="group">
                        Entire Group
                      </ToggleButton>
                      <ToggleButton value="individual">
                        Individual Mentee
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  {!editingTaskId && (
                    assignType === 'group' ? (
                      <Grid item xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel id="select-group-label">Select Group</InputLabel>
                          <Select
                            labelId="select-group-label"
                            value={groupId}
                            label="Select Group"
                            onChange={(e) => setGroupId(e.target.value)}
                          >
                            <MenuItem value="" disabled>Select a Group</MenuItem>
                            {groups.map((g) => (
                              <MenuItem key={g.id} value={g.id}>{g.groupName}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel id="select-mentee-label">Select Mentee</InputLabel>
                          <Select
                            labelId="select-mentee-label"
                            value={menteeId}
                            label="Select Mentee"
                            onChange={(e) => setMenteeId(e.target.value)}
                          >
                            <MenuItem value="" disabled>Select a Mentee</MenuItem>
                            {mentees.map((m) => (
                              <MenuItem key={m.id} value={m.id}>{m.name} ({m.email})</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )
                  )}

                  {/* Task Details */}
                  <Grid item xs={12}>
                    <TextField
                      label="Task Title"
                      fullWidth
                      required
                      value={title}
                      placeholder="e.g. Week 3: Build REST APIs"
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Task Description & Requirements"
                      fullWidth
                      multiline
                      rows={4}
                      value={description}
                      placeholder="Write clear task objectives, guides, or resources here..."
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Week Number"
                      type="number"
                      fullWidth
                      required
                      value={weekNumber}
                      onChange={(e) => setWeekNumber(e.target.value)}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="select-priority-label">Priority</InputLabel>
                      <Select
                        labelId="select-priority-label"
                        value={priority}
                        label="Priority"
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Deadline"
                      type="datetime-local"
                      fullWidth
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color={editingTaskId ? "secondary" : "primary"}
                      fullWidth
                      size="large"
                      startIcon={editingTaskId ? <EditIcon /> : <SendIcon />}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : (editingTaskId ? 'Update Task' : 'Assign Task')}
                    </Button>

                    {editingTaskId && (
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancelEdit}
                        startIcon={<CancelIcon />}
                        sx={{ width: '40%' }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Task List Column */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: '1px solid #1f2937', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon /> Tasks Issued By You
              </Typography>

              <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', flexGrow: 1, maxHeight: 600, overflowX: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell align="center">Week</TableCell>
                      <TableCell>Target Group</TableCell>
                      <TableCell>Deadline</TableCell>
                      <TableCell align="center">Priority</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasksLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : mentorTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">No tasks assigned yet.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      mentorTasks.map((task) => (
                        <TableRow key={task.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{task.title}</TableCell>
                          <TableCell align="center">{task.weekNumber}</TableCell>
                          <TableCell>{task.group ? task.group.groupName : 'Individual'}</TableCell>
                          <TableCell>{formatDeadline(task.deadline)}</TableCell>
                          <TableCell align="center">
                            <Chip label={task.priority} size="small" color={getPriorityColor(task.priority)} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit Task details">
                                <IconButton size="small" color="primary" onClick={() => handleEditClick(task)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Task and all history">
                                <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CreateTask;
