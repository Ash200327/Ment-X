import React, { useState, useEffect } from 'react';
import { Container, Card, CardContent, Typography, TextField, Button, Box, Grid, MenuItem, Select, FormControl, InputLabel, Alert, CircularProgress, Paper, Divider, Chip, IconButton, RadioGroup, Radio, FormControlLabel, FormLabel } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sendType, setSendType] = useState('USER'); // 'USER' or 'GROUP'
  const [loading, setLoading] = useState(true);
  
  // Send notification form states
  const [targetUserId, setTargetUserId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get('/api/notifications/recipients');
      setRecipients(res.data);
    } catch (e) {
      console.error("Failed to fetch recipients list", e);
    }
  };

  const fetchGroups = async () => {
    if (!user || user.role === 'MENTEE') return;
    try {
      const url = user.role === 'ADMIN' ? '/api/groups/all' : '/api/groups';
      const res = await axiosInstance.get(url);
      setGroups(res.data);
    } catch (e) {
      console.error("Failed to fetch groups list", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchRecipients();
    fetchGroups();
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      // Update locally
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (sendType === 'USER' && !targetUserId) {
      setError("Please select a recipient user.");
      return;
    }
    if (sendType === 'GROUP' && !targetGroupId) {
      setError("Please select a recipient group.");
      return;
    }
    if (!title.trim() || !message.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    setError('');
    setSuccess('');
    setSendLoading(true);

    try {
      const payload = {
        title,
        message,
        targetUserId: sendType === 'USER' ? targetUserId : null,
        targetGroupId: sendType === 'GROUP' ? targetGroupId : null
      };
      await axiosInstance.post('/api/notifications', payload);
      setSuccess("Notification sent successfully!");
      setTargetUserId('');
      setTargetGroupId('');
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send notification.");
    } finally {
      setSendLoading(false);
    }
  };

  const hasUnread = notifications.some(n => !n.readStatus);

  return (
    <Container maxWidth="xl" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Platform Notifications
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Left Side: Send custom notifications */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: '1px solid #1f2937' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                {user?.role === 'MENTEE' ? 'Send Notification to Mentor' : 'Send Custom Notification'}
              </Typography>
              
              <form onSubmit={handleSendNotification}>
                <Grid container spacing={2.5}>
                  {user && user.role !== 'MENTEE' && (
                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1 }}>Send To:</FormLabel>
                        <RadioGroup
                          row
                          value={sendType}
                          onChange={(e) => setSendType(e.target.value)}
                        >
                          <FormControlLabel value="USER" control={<Radio size="small" />} label="Single User" />
                          <FormControlLabel value="GROUP" control={<Radio size="small" />} label="Whole Group" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  )}

                  {sendType === 'USER' ? (
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="select-recipient-label">
                          {user?.role === 'MENTEE' ? 'Select Mentor' : 'Recipient User'}
                        </InputLabel>
                        <Select
                          labelId="select-recipient-label"
                          value={targetUserId}
                          label={user?.role === 'MENTEE' ? 'Select Mentor' : 'Recipient User'}
                          onChange={(e) => setTargetUserId(e.target.value)}
                        >
                          <MenuItem value="" disabled>
                            {user?.role === 'MENTEE' ? 'Select a Mentor' : 'Select a Recipient'}
                          </MenuItem>
                          {recipients.map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                              {r.name} ({r.role} - {r.email})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="select-group-label">Recipient Group</InputLabel>
                        <Select
                          labelId="select-group-label"
                          value={targetGroupId}
                          label="Recipient Group"
                          onChange={(e) => setTargetGroupId(e.target.value)}
                        >
                          <MenuItem value="" disabled>Select a Group</MenuItem>
                          {groups.map((g) => (
                            <MenuItem key={g.id} value={g.id}>
                              {g.groupName} ({g.description || 'No description'})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      label="Notification Title"
                      fullWidth
                      required
                      value={title}
                      placeholder="e.g. Question regarding Task"
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Message"
                      fullWidth
                      required
                      multiline
                      rows={4}
                      value={message}
                      placeholder="Type notification content..."
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      startIcon={<SendIcon />}
                      disabled={sendLoading}
                      sx={{ py: 1.5 }}
                    >
                      {sendLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Notification'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Received Notifications List */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: '1px solid #1f2937', minHeight: 450, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" /> My Inbox ({notifications.length})
                </Typography>
                {hasUnread && (
                  <Button variant="outlined" color="primary" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead}>
                    Mark All Read
                  </Button>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 600 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">Your notification inbox is empty.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {notifications.map((notif) => (
                      <Paper
                        key={notif.id}
                        sx={{
                          p: 2.5,
                          border: '1px solid #1f2937',
                          backgroundColor: notif.readStatus ? 'rgba(255,255,255,0.01)' : 'rgba(99,102,241,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: notif.readStatus ? 600 : 800, color: notif.readStatus ? 'text.primary' : '#818cf8' }}>
                              {notif.title}
                            </Typography>
                            {!notif.readStatus && (
                              <Chip label="NEW" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }} />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Received: {new Date(notif.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        {!notif.readStatus && (
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleMarkRead(notif.id)}
                            sx={{ border: '1px solid rgba(16,185,129,0.3)', borderRadius: 2 }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Notifications;
