import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Chip, useTheme, Surface } from 'react-native-paper';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MenteeDashboard = () => {
  const theme = useTheme();
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch dashboard data in parallel
      const [leaderboardRes, tasksRes, scoresRes] = await Promise.all([
        axiosInstance.get('/api/leaderboard'),
        axiosInstance.get('/api/tasks/mentee'),
        axiosInstance.get('/api/reviews/my-scores')
      ]);

      const myRankInfo = leaderboardRes.data.find(row => row.userId === user?.id);
      
      const pendingCount = tasksRes.data.filter(t => ['ASSIGNED', 'VIEWED', 'IN_PROGRESS', 'NEEDS_IMPROVEMENT'].includes(t.status)).length;
      const completedCount = tasksRes.data.filter(t => t.status === 'COMPLETED').length;

      // 3. Process weekly scores
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
      const reviewsPromises = reviews.map(async (review) => {
        try {
          const updateRes = await axiosInstance.get(`/api/updates/assignments/${review.id}`);
          if (updateRes.data?.id) {
            const remarkRes = await axiosInstance.get(`/api/reviews/updates/${updateRes.data.id}/remark`);
            return {
              taskTitle: review.task.title,
              status: review.status,
              remarkText: remarkRes.data?.remark || 'No remark left.',
              score: review.status === 'COMPLETED' ? myRankInfo?.weeklyScore || 0 : null
            };
          }
        } catch (e) {
          console.log("Failed to load remark details for a task");
        }
        return null;
      });

      const resolvedReviews = await Promise.all(reviewsPromises);
      setRecentRemarks(resolvedReviews.filter(r => r !== null));

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statsCards = [
    { title: 'Total Points', value: stats.totalPoints, icon: 'star', color: '#8b5cf6' },
    { title: 'Leaderboard Rank', value: stats.rank === '-' ? '-' : `#${stats.rank}`, icon: 'poll', color: '#0ea5e9' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: 'clipboard-text-clock', color: '#ef4444', highlight: stats.pendingTasks > 0 },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: 'clipboard-check', color: '#10b981' }
  ];

  if (loading && !stats.totalPoints && !weeklyScores.weeks.length) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.greeting, { color: theme.colors.onBackground }]}>
          Welcome back, {user?.name}!
        </Text>
        
        <View style={styles.badgesContainer}>
          {stats.hasTopPerformerBadge && (
            <Chip 
              icon={() => <MaterialCommunityIcons name="trophy" size={16} color="#fbbf24" />} 
              style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}
              textStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
            >
              Top Performer
            </Chip>
          )}
          {stats.hasConsistencyBadge && (
            <Chip 
              icon={() => <MaterialCommunityIcons name="fire" size={16} color="#f87171" />} 
              style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}
              textStyle={{ color: '#f87171', fontWeight: 'bold' }}
            >
              Consistent Performer
            </Chip>
          )}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.grid}>
        {statsCards.map((card, idx) => (
          <Surface 
            key={idx} 
            style={[
              styles.cardSurface, 
              card.highlight && styles.highlightSurface,
              { borderLeftColor: card.color, borderLeftWidth: 4 }
            ]}
            elevation={2}
          >
            <View style={styles.cardContent}>
              <View>
                <Text variant="labelMedium" style={styles.cardTitle}>{card.title}</Text>
                <Text variant="displaySmall" style={styles.cardValue}>{card.value}</Text>
              </View>
              <MaterialCommunityIcons name={card.icon} size={36} color={card.color} style={{ opacity: 0.9 }} />
            </View>
          </Surface>
        ))}
      </View>

      {/* Performance Horizontal Scroll */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Weekly Performance
        </Text>
        {weeklyScores.weeks.length <= 1 && weeklyScores.scores[0] === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyCardContent}>
              <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={48} color={theme.colors.primary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No scores recorded yet. Submit your weekly updates to receive grades!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scoresScroll}>
            {weeklyScores.weeks.map((week, idx) => (
              <Card key={idx} style={styles.scoreCard}>
                <Card.Content style={styles.scoreCardContent}>
                  <Text variant="titleMedium" style={styles.weekText}>{week}</Text>
                  <Text variant="headlineMedium" style={styles.scoreText}>{weeklyScores.scores[idx]}</Text>
                  <Text variant="labelSmall" style={styles.maxScoreText}>/ 10</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Recent Feedback Feed */}
      <View style={[styles.section, styles.lastSection]}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Recent Mentor Remarks
        </Text>
        {recentRemarks.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyCardContent}>
              <MaterialCommunityIcons name="comment-outline" size={48} color={theme.colors.primary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No remarks received yet. Complete a task to get feedback!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          recentRemarks.map((item, idx) => (
            <Card key={idx} style={styles.remarkCard}>
              <Card.Content>
                <View style={styles.remarkHeader}>
                  <Text variant="titleMedium" style={styles.remarkTitle}>{item.taskTitle}</Text>
                  <Chip 
                    textStyle={{ fontSize: 10 }} 
                    style={{ backgroundColor: item.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}
                  >
                    {item.status}
                  </Chip>
                </View>
                <Text variant="bodyMedium" style={[styles.remarkText, { color: theme.colors.onSurfaceVariant }]}>
                  "{item.remarkText}"
                </Text>
                {item.score !== null && (
                  <View style={styles.scoreRow}>
                    <MaterialCommunityIcons name="star" color={theme.colors.primary} size={16} />
                    <Text variant="labelMedium" style={[styles.scoreRowText, { color: theme.colors.primary }]}>
                      Score: {item.score}/10
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  cardSurface: {
    width: '46%',
    margin: '2%',
    borderRadius: 12,
    padding: 16,
  },
  highlightSurface: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    opacity: 0.7,
  },
  cardValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  lastSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyCard: {
    marginVertical: 10,
    borderStyle: 'dashed',
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: 24,
  },
  scoresScroll: {
    paddingRight: 16,
    gap: 12,
    flexDirection: 'row',
  },
  scoreCard: {
    width: 100,
    borderRadius: 12,
  },
  scoreCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  weekText: {
    fontWeight: 'bold',
    opacity: 0.7,
  },
  scoreText: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  maxScoreText: {
    opacity: 0.5,
  },
  remarkCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  remarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  remarkTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  remarkText: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreRowText: {
    fontWeight: 'bold',
  }
});

export default MenteeDashboard;
