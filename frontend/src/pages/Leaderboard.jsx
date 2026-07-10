import React, { useEffect, useState } from 'react';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Chip, Button, Alert, Tooltip, Avatar } from '@mui/material';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import FlameIcon from '@mui/icons-material/LocalFireDepartment';
import CrownIcon from '@mui/icons-material/MilitaryTech';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useSelector } from 'react-redux';
import axiosInstance, { baseURL } from '../api/axiosInstance';

const Leaderboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/leaderboard');
      setLeaderboard(res.data);
    } catch (e) {
      setError("Failed to fetch leaderboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleResetScores = async () => {
    if (window.confirm("Are you sure you want to reset all leaderboard scores? This will delete all points permanentely!")) {
      try {
        await axiosInstance.post('/api/admin/reset-scores');
        setMessage("All scores have been reset successfully.");
        fetchLeaderboard();
      } catch (e) {
        setError("Failed to reset scores.");
      }
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <CrownIcon sx={{ color: '#fbbf24' }} />; // Gold
    if (rank === 2) return <CrownIcon sx={{ color: '#9ca3af' }} />; // Silver
    if (rank === 3) return <CrownIcon sx={{ color: '#b45309' }} />; // Bronze
    return rank;
  };

  return (
    <Container maxWidth="lg" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Leaderboard
        </Typography>

        {user?.role === 'ADMIN' && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={handleResetScores}
          >
            Reset Scores
          </Button>
        )}
      </Box>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80 }}>Rank</TableCell>
              <TableCell>Mentee Name</TableCell>
              <TableCell align="center">Completed Tasks</TableCell>
              <TableCell align="center">Weeks Active</TableCell>
              <TableCell align="center">Average Score</TableCell>
              <TableCell align="center">Latest Score</TableCell>
              <TableCell align="center">Total Points</TableCell>
              <TableCell align="right">Badges / Achievements</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Loading rankings...</Typography>
                </TableCell>
              </TableRow>
            ) : leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No participants recorded yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              leaderboard.map((row) => (
                <TableRow
                  key={row.userId}
                  sx={{
                    backgroundColor: row.userId === user?.id ? 'rgba(99, 102, 241, 0.05)' : 'inherit',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' },
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {row.eligible ? getRankBadge(row.rank) : (
                      <Tooltip title="Requires at least 2 weeks of scoring activity to be ranked on the leaderboard">
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontStyle: 'italic' }}>
                          Unranked
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: row.userId === user?.id ? 700 : 500 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={row.hasProfilePicture ? `${baseURL}/api/users/${row.id}/avatar` : null}
                        sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: '#6366f1' }}
                      >
                        {row.name?.substring(0, 2).toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        {row.name} {row.userId === user?.id && <Typography component="span" variant="caption" sx={{ color: '#818cf8', ml: 1 }}>(You)</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{row.completedTasks}</TableCell>
                  <TableCell align="center">{row.activeWeeks} {row.activeWeeks === 1 ? 'wk' : 'wks'}</TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontWeight: 700, color: '#10b981' }}>
                      {row.averageScore?.toFixed(1) || '0.0'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontWeight: 600, color: row.weeklyScore > 0 ? '#10b981' : 'inherit' }}>
                      {row.weeklyScore}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontWeight: 700, color: '#818cf8', fontSize: '1.05rem' }}>
                      {row.totalScore}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {row.topPerformer && (
                        <Tooltip title="Awarded to the top performers based on total score">
                          <Chip
                            icon={<TrophyIcon style={{ color: '#f59e0b', fontSize: '1.1rem' }} />}
                            label="Top Performer"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              borderColor: 'rgba(245, 158, 11, 0.3)',
                              fontWeight: 700,
                              borderWidth: 1,
                              borderStyle: 'solid'
                            }}
                          />
                        </Tooltip>
                      )}
                      {row.consistencyBadge && (
                        <Tooltip title="Awarded for submitting 3+ tasks with average score >= 8">
                          <Chip
                            icon={<FlameIcon style={{ color: '#ef4444', fontSize: '1.1rem' }} />}
                            label="Consistent"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              fontWeight: 700,
                              borderWidth: 1,
                              borderStyle: 'solid'
                            }}
                          />
                        </Tooltip>
                      )}
                      {!row.topPerformer && !row.consistencyBadge && (
                        <Typography variant="body2" color="text.disabled">—</Typography>
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

export default Leaderboard;
