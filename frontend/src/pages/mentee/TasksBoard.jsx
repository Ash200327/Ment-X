import React, { useEffect, useState } from 'react';
import { Container, Card, CardContent, Typography, Grid, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Slider, Alert, Chip, Divider, Tooltip, Paper } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
import FlameIcon from '@mui/icons-material/LocalFireDepartment';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import axiosInstance from '../../api/axiosInstance';

const TasksBoard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('ACTIVE'); // 'ACTIVE' or 'SUBMITTED'

  const now = new Date();
  const activeAssignments = assignments.filter(r => !['SUBMITTED', 'COMPLETED'].includes(r.status) && new Date(r.task.deadline) >= now);
  const pastAssignments = assignments.filter(r => ['SUBMITTED', 'COMPLETED'].includes(r.status));
  const overdueAssignments = assignments.filter(r => !['SUBMITTED', 'COMPLETED'].includes(r.status) && new Date(r.task.deadline) < now);
  const filteredAssignments = 
    filterType === 'ACTIVE' ? activeAssignments : 
    filterType === 'SUBMITTED' ? pastAssignments : 
    overdueAssignments;

  // Update submission form state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [summary, setSummary] = useState('');
  const [challenges, setChallenges] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(50);
  const [isBypass, setIsBypass] = useState(true); // Default local indicator

  // Details dialog state (for viewed remarks/scores)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [remark, setRemark] = useState(null);
  const [score, setScore] = useState(null);

  // Task Details dialog state
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleCloseTaskDetails = () => {
    setTaskDetailsOpen(false);
    setSelectedTask(null);
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/tasks/mentee');
      setAssignments(res.data);
    } catch (e) {
      setError("Failed to fetch assigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/tasks/assignments/${id}/read`);
      setSuccess("Task marked as read.");
      fetchAssignments();
    } catch (e) {
      setError("Failed to update status.");
    }
  };

  const handleStartTask = async (id) => {
    try {
      await axiosInstance.patch(`/api/tasks/assignments/${id}/start`);
      setSuccess("Task marked as In Progress.");
      fetchAssignments();
    } catch (e) {
      setError("Failed to update status.");
    }
  };

  const handleOpenSubmit = async (assignment) => {
    setSelectedAssignment(assignment);
    setSummary('');
    setChallenges('');
    setCompletionPercentage(50);
    setError('');
    
    // Check if an update already exists (editing)
    if (['SUBMITTED', 'NEEDS_IMPROVEMENT'].includes(assignment.status)) {
      try {
        const updateRes = await axiosInstance.get(`/api/updates/assignments/${assignment.id}`);
        setSummary(updateRes.data.summary);
        setChallenges(updateRes.data.challenges || '');
        setCompletionPercentage(updateRes.data.completionPercentage);
      } catch (e) {}
    }
    
    setSubmitDialogOpen(true);
  };

  const handleCloseSubmit = () => {
    setSubmitDialogOpen(false);
    setSelectedAssignment(null);
  };

  const handleSubmitUpdate = async () => {
    if (!summary.trim()) {
      setError("Please describe the work summary.");
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axiosInstance.post(`/api/updates/assignments/${selectedAssignment.id}`, {
        summary,
        challenges,
        completionPercentage
      });
      setSuccess("Weekly progress update submitted!");
      fetchAssignments();
      setTimeout(handleCloseSubmit, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit weekly update. Note: updates can only be submitted after the deadline and up to the end of the following day unless bypass is enabled.");
    }
  };

  const handleOpenDetails = async (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedUpdate(null);
    setRemark(null);
    setScore(null);
    setError('');

    try {
      const updateRes = await axiosInstance.get(`/api/updates/assignments/${assignment.id}`);
      setSelectedUpdate(updateRes.data);

      try {
        const remarkRes = await axiosInstance.get(`/api/reviews/updates/${updateRes.data.id}/remark`);
        setRemark(remarkRes.data);
      } catch (e) {}

      try {
        const scoreRes = await axiosInstance.get(`/api/reviews/assignments/${assignment.id}/score`);
        setScore(scoreRes.data);
      } catch (e) {}

      setDetailsDialogOpen(true);
    } catch (e) {
      setError("Failed to retrieve task submission details.");
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedAssignment(null);
    setSelectedUpdate(null);
    setRemark(null);
    setScore(null);
  };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED' || status === 'SUBMITTED') return '#10b981'; // Green
    if (status === 'IN_PROGRESS' || status === 'NEEDS_IMPROVEMENT') return '#3b82f6'; // Blue
    return '#9ca3af'; // Grey for ASSIGNED, VIEWED
  };

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

  const renderDescriptionWithLinks = (text) => {
    if (!text) return 'No description provided.';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Container maxWidth="lg" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My Tasks
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant={filterType === 'ACTIVE' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setFilterType('ACTIVE')}
          >
            Active Tasks ({activeAssignments.length})
          </Button>
          <Button
            variant={filterType === 'SUBMITTED' ? 'contained' : 'outlined'}
            color="secondary"
            onClick={() => setFilterType('SUBMITTED')}
          >
            Past Submitted Tasks ({pastAssignments.length})
          </Button>
          <Button
            variant={filterType === 'OVERDUE' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => setFilterType('OVERDUE')}
          >
            Missed Tasks ({overdueAssignments.length})
          </Button>
        </Box>
      </Box>

      {/* Warning Notice Banner */}
      <Alert 
        severity="warning" 
        variant="outlined"
        icon={<InfoIcon sx={{ color: '#ef4444' }} />}
        sx={{ 
          mb: 4, 
          borderColor: 'rgba(239, 68, 68, 0.4)', 
          bgcolor: 'rgba(239, 68, 68, 0.05)', 
          color: '#fca5a5',
          borderRadius: 2,
          fontWeight: 600,
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.25)',
          '& .MuiAlert-message': {
            fontSize: '0.95rem'
          }
        }}
      >
        No previous task updates will lead to no newer task assignments. Please contact your mentor for any problems or discussion.
      </Alert>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Typography color="text.secondary">Loading task board...</Typography>
      ) : filteredAssignments.length === 0 ? (
        <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
          <Typography color="text.secondary">
            {filterType === 'ACTIVE' ? 'No active tasks found.' : filterType === 'SUBMITTED' ? 'No past submitted tasks found.' : 'No missed/overdue tasks found.'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredAssignments.map((row) => (
            <Grid item xs={12} md={6} key={row.id}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `6px solid ${getStatusColor(row.status)}`
              }}>
                <Box sx={{ 
                  px: 2, 
                  py: 1, 
                  background: row.task.group 
                    ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(17, 24, 39, 0) 100%)' 
                    : 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 24, 39, 0) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  {row.task.group ? (
                    <>
                      <PeopleIcon sx={{ fontSize: '1rem', color: '#6366f1' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Group: {row.task.group.groupName}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <StarIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Specially for You
                      </Typography>
                    </>
                  )}
                </Box>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip label={`Week ${row.task.weekNumber}`} size="small" variant="outlined" />
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        backgroundColor: `${getStatusColor(row.status)}15`,
                        color: getStatusColor(row.status),
                        fontWeight: 700,
                        border: `1px solid ${getStatusColor(row.status)}40`
                      }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {row.task.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{
                    mb: 3,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {renderDescriptionWithLinks(row.task.description)}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <Typography variant="caption" color="text.secondary">
                      Deadline: <strong>{formatDeadline(row.task.deadline)}</strong>
                    </Typography>
                    <Chip
                      label={row.task.priority}
                      size="small"
                      color={row.task.priority === 'HIGH' ? 'error' : row.task.priority === 'MEDIUM' ? 'warning' : 'info'}
                    />
                  </Box>
                </CardContent>

                 <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                   {(() => {
                     const isOverdue = new Date(row.task.deadline) < now;
                     return (
                       <>
                         <Button size="small" variant="outlined" color="info" startIcon={<InfoIcon />} onClick={() => handleOpenTaskDetails(row.task)}>
                           View Task Details
                         </Button>

                         {row.status === 'ASSIGNED' && (
                           <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} disabled={isOverdue} onClick={() => handleMarkRead(row.id)}>
                             Mark Read
                           </Button>
                         )}

                         {['ASSIGNED', 'VIEWED'].includes(row.status) && (
                           <Button size="small" variant="outlined" color="primary" startIcon={<PlayArrowIcon />} disabled={isOverdue} onClick={() => handleStartTask(row.id)}>
                             Start Work
                           </Button>
                         )}

                         {['IN_PROGRESS', 'NEEDS_IMPROVEMENT', 'SUBMITTED'].includes(row.status) && (
                           <Button size="small" variant="contained" color="secondary" startIcon={<SendIcon />} disabled={isOverdue} onClick={() => handleOpenSubmit(row)}>
                             {row.status === 'SUBMITTED' ? 'Edit Update' : 'Submit Update'}
                           </Button>
                         )}

                         {['SUBMITTED', 'COMPLETED', 'NEEDS_IMPROVEMENT'].includes(row.status) && (
                           <Button size="small" variant="outlined" onClick={() => handleOpenDetails(row)}>
                             View Submission Details
                           </Button>
                         )}
                       </>
                     );
                   })()}
                 </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Submit Update Dialog */}
      <Dialog open={submitDialogOpen} onClose={handleCloseSubmit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Submit Weekly Progress Update
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Alert severity="info">
              Updates can only be submitted after the task's deadline has passed, up to the end of the following day. Development bypass mode is active, letting you submit updates at any time.
            </Alert>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Work Summary (What did you achieve?)"
              multiline
              rows={4}
              fullWidth
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="List implemented tasks, APIs built, UI changes made..."
            />

            <TextField
              label="Challenges Faced"
              multiline
              rows={2}
              fullWidth
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="State blocker issues, bugs, or missing resources..."
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Completion Percentage ({completionPercentage}%):
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={completionPercentage}
                  onChange={(e, val) => setCompletionPercentage(val)}
                  min={0}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseSubmit} color="inherit">Cancel</Button>
          <Button onClick={handleSubmitUpdate} variant="contained" color="secondary">
            Submit Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        {selectedAssignment && selectedUpdate && (
          <>
            <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #1f2937' }}>
              Submission History: {selectedAssignment.task.title}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Completion Percentage:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>{selectedUpdate.completionPercentage}%</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">My Summary of Work:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)' }}>
                    {selectedUpdate.summary}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">My Reported Challenges:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)' }}>
                    {selectedUpdate.challenges || 'No challenges reported.'}
                  </Typography>
                </Box>

                <Divider />

                {/* Remarks & Grades Section */}
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #1f2937', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedInIcon sx={{ color: '#6366f1' }} /> Mentor Assessment
                  </Typography>

                  {remark ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Review Decision:</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={remark.reviewStatus}
                            size="small"
                            color={remark.reviewStatus === 'APPROVED' ? 'success' : 'warning'}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Remarks Comment:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>"{remark.remark}"</Typography>
                      </Box>
                      {score && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Awarded Weekly Score:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <StarIcon sx={{ color: '#fbbf24', fontSize: '1.2rem' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{score.score} / 10</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
                      Pending review from your mentor. You will receive a notification once graded.
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDetails} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Task Specifications Details Dialog */}
      <Dialog open={taskDetailsOpen} onClose={handleCloseTaskDetails} maxWidth="md" fullWidth>
        {selectedTask && (
          <>
            <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #1f2937' }}>
              Task Specifications: {selectedTask.title}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Chip label={`Week ${selectedTask.weekNumber}`} color="primary" variant="outlined" />
                  <Chip
                    label={selectedTask.priority}
                    color={selectedTask.priority === 'HIGH' ? 'error' : selectedTask.priority === 'MEDIUM' ? 'warning' : 'info'}
                  />
                  <Chip label={`Deadline: ${formatDeadline(selectedTask.deadline)}`} variant="outlined" />
                  {selectedTask.group ? (
                    <Chip 
                      icon={<PeopleIcon sx={{ fontSize: '0.9rem !important' }} />}
                      label={`Group: ${selectedTask.group.groupName}`} 
                      color="secondary" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<StarIcon sx={{ fontSize: '0.9rem !important' }} />}
                      label="Specially for You" 
                      color="success" 
                      variant="outlined" 
                    />
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Full Description & Code/Instructions:</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      mt: 1, 
                      borderRadius: 1.5, 
                      bgcolor: 'rgba(0,0,0,0.2)', 
                      borderColor: '#1f2937',
                      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.9rem',
                      overflowX: 'auto'
                    }}
                  >
                    {renderDescriptionWithLinks(selectedTask.description)}
                  </Paper>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseTaskDetails} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default TasksBoard;
