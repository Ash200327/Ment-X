import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { BarChart, LineChart } from '@mui/x-charts';
import RateReviewIcon from '@mui/icons-material/RateReview';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ groupsCount: 0, tasksCount: 0, pendingReviews: 0 });
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [chartData, setChartData] = useState({ titles: [], completed: [], total: [], avgScores: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch groups, tasks, and assignments
      const groupsRes = await axiosInstance.get('/api/groups');
      const tasksRes = await axiosInstance.get('/api/tasks/mentor');
      const pendingRes = await axiosInstance.get('/api/tasks/mentor/pending-reviews');
      const allAssignmentsRes = await axiosInstance.get('/api/tasks/mentor/assignments');

      setStats({
        groupsCount: groupsRes.data.length,
        tasksCount: tasksRes.data.length,
        pendingReviews: pendingRes.data.length
      });

      setPendingSubmissions(pendingRes.data);

      // Process assignments for charts
      // Group assignments by Task ID/Title
      const taskGroups = {};
      
      // We will also fetch scores to calculate averages
      // Wait, we can gather scores from completed assignments. Since we get assignments, does the response contain the score?
      // Let's call /api/reviews/assignments/{id}/score for completed ones or calculate.
      // Better yet, we can fetch all scores. Since we don't have a "get all scores" for mentor, we can fetch score for each completed assignment asynchronously, or check if the assignment response has score.
      // Wait! In `TaskAssignment.java`, we don't have the `Score` field directly because it is in a separate entity linked by `@OneToOne`. But when hibernate serializes, it won't include it unless we mapped it.
      // Let's fetch the score for each completed assignment or keep it simple: we can map the completed assignments to default/estimated scores or just count completion percentages!
      // Wait, in `WeeklyUpdate` (which is inside assignment), we have `completionPercentage`! We can chart the average completion percentage reported by mentees for each task! That is incredibly useful, 100% available in the assignment DTO, and doesn't require extra calls.
      // Let's chart: (1) Completion Rate (completed / total) and (2) Average reported progress % per task.
      
      allAssignmentsRes.data.forEach((asg) => {
        const title = asg.task.title;
        if (!taskGroups[title]) {
          taskGroups[title] = { completed: 0, total: 0, sumProgress: 0 };
        }
        taskGroups[title].total += 1;
        if (asg.status === 'COMPLETED') {
          taskGroups[title].completed += 1;
        }
        // If there's an update, add completion percentage
        if (asg.status === 'SUBMITTED' || asg.status === 'COMPLETED' || asg.status === 'NEEDS_IMPROVEMENT') {
          // In a real app we'd fetch the update progress.
          // Since the update is lazy-loaded, we can check if it is available or assume standard.
          // Let's just chart completed vs total.
        }
      });

      const titles = [];
      const completed = [];
      const total = [];

      Object.keys(taskGroups).forEach((title) => {
        titles.push(title.length > 15 ? title.substring(0, 15) + '..' : title);
        completed.push(taskGroups[title].completed);
        total.push(taskGroups[title].total);
      });

      setChartData({
        titles: titles.slice(0, 5), // top 5 tasks
        completed: completed.slice(0, 5),
        total: total.slice(0, 5)
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metricCards = [
    { title: 'My Groups', value: stats.groupsCount, icon: <GroupIcon sx={{ fontSize: '2.5rem', color: '#6366f1' }} />, path: '/mentor/groups' },
    { title: 'Tasks Created', value: stats.tasksCount, icon: <AssignmentIcon sx={{ fontSize: '2.5rem', color: '#10b981' }} />, path: '/mentor/create-task' },
    { title: 'Pending Reviews', value: stats.pendingReviews, icon: <RateReviewIcon sx={{ fontSize: '2.5rem', color: '#f59e0b' }} />, path: '/mentor/reviews', highlight: (stats.pendingReviews > 0) },
  ];

  return (
    <Container maxWidth="xl" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Mentor Dashboard
      </Typography>

      {/* Summary Row */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {metricCards.map((card, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card sx={{
              border: card.highlight ? '1px solid #f59e0b' : '1px solid #1f2937',
              backgroundColor: card.highlight ? 'rgba(245, 158, 11, 0.03)' : '#111827',
              cursor: 'pointer'
            }} onClick={() => navigate(card.path)}>
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
        {/* Pending Reviews Section */}
        <Grid item xs={12} lg={6}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RateReviewIcon /> Submissions Awaiting Review ({pendingSubmissions.length})
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3, maxHeight: 350, overflowX: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Mentee</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell align="center">Week</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">Loading submissions...</Typography>
                    </TableCell>
                  </TableRow>
                ) : pendingSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">All updates are reviewed! Good job.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingSubmissions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.mentee.name}</TableCell>
                      <TableCell>{row.task.title}</TableCell>
                      <TableCell align="center">{row.task.weekNumber}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" onClick={() => navigate('/mentor/reviews')}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Analytics Section */}
        <Grid item xs={12} lg={6}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon /> Task Completion Analytics
          </Typography>
          <Card sx={{ p: 2, border: '1px solid #1f2937' }}>
            <CardContent>
              {loading ? (
                <Typography color="text.secondary" align="center">Loading analytics...</Typography>
              ) : chartData.titles.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No task statistics to display.</Typography>
              ) : (
                <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
                  <BarChart
                    xAxis={[{ scaleType: 'band', data: chartData.titles }]}
                    series={[
                      { data: chartData.total, label: 'Assigned', color: '#6366f1' },
                      { data: chartData.completed, label: 'Completed', color: '#10b981' }
                    ]}
                    width={500}
                    height={300}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MentorDashboard;
