import React, { useEffect, useState } from 'react';
import { Container, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Slider, ToggleButtonGroup, ToggleButton, Alert, Chip } from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axiosInstance from '../../api/axiosInstance';

const SubmissionsReview = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected assignment for review dialog
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [remark, setRemark] = useState('');
  const [reviewStatus, setReviewStatus] = useState('APPROVED'); // APPROVED or NEEDS_IMPROVEMENT
  const [score, setScore] = useState(10); // Default 10 points
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/tasks/mentor/assignments');
      // Filter or sort so submitted/pending reviews are at the top!
      const sorted = res.data.sort((a, b) => {
        if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
        if (a.status !== 'SUBMITTED' && b.status === 'SUBMITTED') return 1;
        return 0;
      });
      setAssignments(sorted);
    } catch (e) {
      setError("Failed to fetch task submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleOpenReview = async (assignment) => {
    setSelectedAssignment(assignment);
    setRemark('');
    setReviewStatus('APPROVED');
    setScore(10);
    setError('');
    setSuccess('');
    
    try {
      // Fetch the specific weekly update
      const res = await axiosInstance.get(`/api/updates/assignments/${assignment.id}`);
      setSelectedUpdate(res.data);
      
      // If previously reviewed, populate current values
      try {
        const remarkRes = await axiosInstance.get(`/api/reviews/updates/${res.data.id}/remark`);
        setRemark(remarkRes.data.remark);
        setReviewStatus(remarkRes.data.reviewStatus);
      } catch(e) {}
      
      try {
        const scoreRes = await axiosInstance.get(`/api/reviews/assignments/${assignment.id}/score`);
        setScore(scoreRes.data.score);
      } catch(e) {}

      setDialogOpen(true);
    } catch (e) {
      setError("Failed to load submission details or no submission was found.");
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAssignment(null);
    setSelectedUpdate(null);
  };

  const handleSubmitReview = async () => {
    if (!remark.trim()) {
      setError("Please write a remark comment.");
      return;
    }
    setError('');
    setSuccess('');
    try {
      const payload = {
        remark,
        reviewStatus,
        score: reviewStatus === 'APPROVED' ? score : 0 // Set score to 0 if rejected
      };
      await axiosInstance.post(`/api/reviews/updates/${selectedUpdate.id}`, payload);
      setSuccess("Submission reviewed successfully!");
      fetchAssignments();
      setTimeout(handleCloseDialog, 1000);
    } catch (e) {
      setError("Failed to submit review.");
    }
  };

  const getStatusChipColor = (status) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'SUBMITTED') return 'info';
    if (status === 'NEEDS_IMPROVEMENT') return 'warning';
    if (status === 'IN_PROGRESS') return 'primary';
    return 'default';
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Submissions Review Board
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mentee</TableCell>
              <TableCell>Task Title</TableCell>
              <TableCell align="center">Week</TableCell>
              <TableCell align="center">Deadline</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Loading assignments...</Typography>
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No tasks assigned yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    backgroundColor: row.status === 'SUBMITTED' ? 'rgba(99, 102, 241, 0.04)' : 'inherit',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' }
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{row.mentee.name}</TableCell>
                  <TableCell>{row.task.title}</TableCell>
                  <TableCell align="center">{row.task.weekNumber}</TableCell>
                  <TableCell align="center">{new Date(row.task.deadline).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Chip label={row.status} size="small" color={getStatusChipColor(row.status)} />
                  </TableCell>
                  <TableCell align="right">
                    {['SUBMITTED', 'COMPLETED', 'NEEDS_IMPROVEMENT'].includes(row.status) ? (
                      <Button
                        size="small"
                        variant={row.status === 'SUBMITTED' ? "contained" : "outlined"}
                        color={row.status === 'SUBMITTED' ? "primary" : "secondary"}
                        startIcon={<RateReviewIcon />}
                        onClick={() => handleOpenReview(row)}
                      >
                        {row.status === 'SUBMITTED' ? 'Review Now' : 'Re-Review'}
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.disabled">No submission yet</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedAssignment && selectedUpdate && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid #1f2937', fontWeight: 700 }}>
              Review Weekly Submission: {selectedAssignment.task.title}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Grid container spacing={3}>
                {/* Submission Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Submission Details</Typography>
                  <Card variant="outlined" sx={{ p: 2, mb: 2, borderColor: '#1f2937' }}>
                    <Typography variant="body2" color="text.secondary">Submitted By:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{selectedAssignment.mentee.name} ({selectedAssignment.mentee.email})</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Completion Percentage:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>{selectedUpdate.completionPercentage}%</Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">Summary of Work Done:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)' }}>
                      {selectedUpdate.summary}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">Challenges Faced:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)' }}>
                      {selectedUpdate.challenges || 'No challenges reported.'}
                    </Typography>
                  </Card>
                </Grid>

                {/* Grading Form */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Grade & Remarks</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* Status selection */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Review Decision:</Typography>
                      <ToggleButtonGroup
                        value={reviewStatus}
                        exclusive
                        onChange={(e, val) => val && setReviewStatus(val)}
                        color={reviewStatus === 'APPROVED' ? 'success' : 'warning'}
                        fullWidth
                      >
                        <ToggleButton value="APPROVED" startIcon={<CheckCircleIcon />}>
                          Approve
                        </ToggleButton>
                        <ToggleButton value="NEEDS_IMPROVEMENT" startIcon={<ErrorOutlineIcon />}>
                          Needs Changes
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {/* Remarks Input */}
                    <TextField
                      label="Mentor Remarks / Comments"
                      multiline
                      rows={4}
                      fullWidth
                      required
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Give positive feedback or explain requested modifications..."
                    />

                    {/* Score Slider */}
                    {reviewStatus === 'APPROVED' && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Assign Score (0 - 10):
                        </Typography>
                        <Box sx={{ px: 2 }}>
                          <Slider
                            value={score}
                            onChange={(e, val) => setScore(val)}
                            min={0}
                            max={10}
                            step={1}
                            marks
                            valueLabelDisplay="on"
                          />
                        </Box>
                      </Box>
                    )}

                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #1f2937' }}>
              <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
              <Button onClick={handleSubmitReview} variant="contained" color="primary">
                Submit Review
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default SubmissionsReview;
