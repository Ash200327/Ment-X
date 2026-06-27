import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent, Box, Alert, Chip, Divider, Tooltip } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import StarIcon from '@mui/icons-material/Star';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlameIcon from '@mui/icons-material/LocalFireDepartment';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const MenteeDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    totalPoints: 0,
    rank: '-',
    pendingTasks: 0,
    completedTasks: 0,
    hasConsistencyBadge: false,
    hasTopPerformerBadge: false
  });
  
  const [weeklyScores, setWeeklyScores] = useState({ weeks: [], scores: [] });
  const [recentRemarks, setRecentRemarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch leaderboard to get rank & badges
      const leaderboardRes = await axiosInstance.get('/api/leaderboard');
      const myRankInfo = leaderboardRes.data.find(row => row.userId === user.id);
      
      // 2. Fetch my tasks to count pending/completed
      const tasksRes = await axiosInstance.get('/api/tasks/mentee');
      const pendingCount = tasksRes.data.filter(t => ['ASSIGNED', 'VIEWED', 'IN_PROGRESS', 'NEEDS_IMPROVEMENT'].includes(t.status)).length;
      const completedCount = tasksRes.data.filter(t => t.status === 'COMPLETED').length;

      // 3. Fetch weekly scores
      const scoresRes = await axiosInstance.get('/api/reviews/my-scores');
      // Sort scores by week number
      const sortedScores = scoresRes.data.sort((a, b) => a.weekNumber - b.weekNumber);
      const weeks = sortedScores.map(s => `W${s.weekNumber}`);
      const scores = sortedScores.map(s => s.score);

      // 4. Gather recent reviews (completed or needs improvement tasks)
      const reviews = tasksRes.data
        .filter(t => ['COMPLETED', 'NEEDS_IMPROVEMENT'].includes(t.status))
        .slice(0, 3); // top 3 recent reviews

      setStats({
        totalPoints: myRankInfo?.totalScore || 0,
        rank: myRankInfo?.rank || '-',
        pendingTasks: pendingCount,
        completedTasks: completedCount,
        hasConsistencyBadge: myRankInfo?.consistencyBadge || false,
        hasTopPerformerBadge: myRankInfo?.topPerformer || false
      });

      setWeeklyScores({
        weeks: weeks.length > 0 ? weeks : ['W0'],
        scores: scores.length > 0 ? scores : [0]
      });

      // Fetch remarks for recent reviews
      const reviewsWithRemarks = [];
      for (let review of reviews) {
        try {
          const updateRes = await axiosInstance.get(`/api/updates/assignments/${review.id}`);
          const remarkRes = await axiosInstance.get(`/api/reviews/updates/${updateRes.data.id}/remark`);
          reviewsWithRemarks.push({
            taskTitle: review.task.title,
            status: review.status,
            remarkText: remarkRes.data.remark,
            score: review.status === 'COMPLETED' ? myRankInfo?.weeklyScore || 0 : null
          });
        } catch (e) {
          console.error("Failed to load remark details", e);
        }
      }
      setRecentRemarks(reviewsWithRemarks);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const statsCards = [
    { title: 'Total Points', value: stats.totalPoints, icon: <StarIcon sx={{ fontSize: '2.5rem', color: '#fbbf24' }} /> },
    { title: 'Leaderboard Rank', value: stats.rank === '-' ? '-' : `#${stats.rank}`, icon: <LeaderboardIcon sx={{ fontSize: '2.5rem', color: '#6366f1' }} /> },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: <AssignmentIcon sx={{ fontSize: '2.5rem', color: '#ef4444' }} />, highlight: stats.pendingTasks > 0 },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: <AssignmentIcon sx={{ fontSize: '2.5rem', color: '#10b981' }} /> }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Welcome back, {user?.name}!
        </Typography>
        
        {/* Badges Display */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {stats.hasTopPerformerBadge && (
            <Tooltip title="Top Performer Badge: Awarded to top 10% of mentees">
              <Chip
                icon={<TrophyIcon style={{ color: '#fbbf24' }} />}
                label="Top Performer"
                sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 700 }}
              />
            </Tooltip>
          )}
          {stats.hasConsistencyBadge && (
            <Tooltip title="Consistency Badge: Awarded for consistent score >= 8">
              <Chip
                icon={<FlameIcon style={{ color: '#f87171' }} />}
                label="Consistent Performer"
                sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 700 }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statsCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{
              border: card.highlight ? '1px solid #ef4444' : '1px solid #1f2937',
              backgroundColor: card.highlight ? 'rgba(239, 68, 68, 0.02)' : '#111827'
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

      <Grid container spacing={4}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={7}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Weekly Performance Progression
          </Typography>
          <Card sx={{ border: '1px solid #1f2937' }}>
            <CardContent>
              {loading ? (
                <Typography color="text.secondary" align="center">Loading chart...</Typography>
              ) : weeklyScores.weeks.length <= 1 && weeklyScores.scores[0] === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                  No scores recorded yet. Submit your Sunday weekly updates to receive grades!
                </Typography>
              ) : (
                <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
                  <LineChart
                    xAxis={[{ scaleType: 'point', data: weeklyScores.weeks }]}
                    series={[{ data: weeklyScores.scores, label: 'Task Score', color: '#6366f1', area: true }]}
                    width={600}
                    height={300}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Feedback Feed */}
        <Grid item xs={12} lg={5}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Recent Mentor Remarks
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              <Typography color="text.secondary">Loading feedback feed...</Typography>
            ) : recentRemarks.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">No remarks received yet.</Typography>
              </Card>
            ) : (
              recentRemarks.map((item, idx) => (
                <Card key={idx} sx={{ border: '1px solid #1f2937' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {item.taskTitle}
                      </Typography>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'COMPLETED' ? 'success' : 'warning'}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 1.5 }}>
                      "{item.remarkText}"
                    </Typography>
                    {item.score !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ color: '#fbbf24', fontSize: '1rem' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Score: {item.score}/10
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MenteeDashboard;
