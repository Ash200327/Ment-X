import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, List, Button, ProgressBar, Divider } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axiosInstance from '../../api/axiosInstance';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function MentorDashboard() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ groupsCount: 0, tasksCount: 0, pendingReviews: 0 });
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [taskStats, setTaskStats] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [groupsRes, tasksRes, pendingRes, allAssignmentsRes] = await Promise.all([
        axiosInstance.get('/api/groups'),
        axiosInstance.get('/api/tasks/mentor'),
        axiosInstance.get('/api/tasks/mentor/pending-reviews'),
        axiosInstance.get('/api/tasks/mentor/assignments')
      ]);

      setStats({
        groupsCount: groupsRes.data.length,
        tasksCount: tasksRes.data.length,
        pendingReviews: pendingRes.data.length
      });

      setPendingSubmissions(pendingRes.data);

      const taskGroups = {};
      allAssignmentsRes.data.forEach((asg) => {
        const title = asg.task.title;
        if (!taskGroups[title]) {
          taskGroups[title] = { completed: 0, total: 0 };
        }
        taskGroups[title].total += 1;
        if (asg.status === 'COMPLETED') {
          taskGroups[title].completed += 1;
        }
      });

      const processedStats = Object.keys(taskGroups).map(title => ({
        title: title.length > 20 ? title.substring(0, 20) + '..' : title,
        completed: taskGroups[title].completed,
        total: taskGroups[title].total,
        percentage: taskGroups[title].total > 0 ? taskGroups[title].completed / taskGroups[title].total : 0
      }));

      setTaskStats(processedStats.slice(0, 5)); // top 5 tasks
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>Mentor Dashboard</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={[styles.summaryCard, { borderLeftColor: '#6366f1', borderLeftWidth: 4 }]} onPress={() => {}}>
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>My Groups</Text>
              <Text variant="headlineMedium" style={styles.statValue}>{stats.groupsCount}</Text>
            </View>
            <MaterialCommunityIcons name="account-group" size={36} color="#6366f1" style={{ opacity: 0.9 }} />
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, { borderLeftColor: '#10b981', borderLeftWidth: 4 }]} onPress={() => navigation.navigate('TaskCreateScreen')}>
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Tasks Created</Text>
              <Text variant="headlineMedium" style={styles.statValue}>{stats.tasksCount}</Text>
            </View>
            <MaterialCommunityIcons name="clipboard-text" size={36} color="#10b981" style={{ opacity: 0.9 }} />
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }, stats.pendingReviews > 0 && styles.highlightSurface]} onPress={() => navigation.navigate('ReviewScreen')}>
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending Reviews</Text>
              <Text variant="headlineMedium" style={styles.statValue}>{stats.pendingReviews}</Text>
            </View>
            <MaterialCommunityIcons name="clipboard-check" size={36} color="#f59e0b" style={{ opacity: 0.9 }} />
          </Card.Content>
        </Card>
      </View>

      {/* Pending Reviews List */}
      <Card style={styles.sectionCard}>
        <Card.Title 
          title={`Submissions Awaiting Review (${pendingSubmissions.length})`}
          left={(props) => <MaterialCommunityIcons name="clipboard-check" size={24} color={theme.colors.primary} />}
        />
        <Divider />
        <Card.Content style={styles.sectionContent}>
          {pendingSubmissions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="check-all" size={48} color={theme.colors.primary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic' }}>All updates are reviewed! Good job.</Text>
            </View>
          ) : (
            pendingSubmissions.slice(0, 5).map((row) => (
              <List.Item
                key={row.id}
                title={`${row.mentee.name}`}
                description={`${row.task.title} (Week ${row.task.weekNumber})`}
                right={props => (
                  <Button mode="contained-tonal" compact onPress={() => navigation.navigate('ReviewScreen')} style={{ alignSelf: 'center' }}>
                    Review
                  </Button>
                )}
                style={styles.listItem}
              />
            ))
          )}
          {pendingSubmissions.length > 5 && (
            <Button mode="text" onPress={() => navigation.navigate('ReviewScreen')}>View All</Button>
          )}
        </Card.Content>
      </Card>

      {/* Analytics Alternative (List) */}
      <Card style={[styles.sectionCard, { marginBottom: 30 }]}>
        <Card.Title 
          title="Task Completion Analytics"
          left={(props) => <MaterialCommunityIcons name="chart-bar" size={24} color={theme.colors.primary} />}
        />
        <Divider />
        <Card.Content style={styles.sectionContent}>
          {taskStats.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-bar" size={48} color={theme.colors.primary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic' }}>No task statistics to display.</Text>
            </View>
          ) : (
            taskStats.map((stat, idx) => (
              <View key={idx} style={styles.statRow}>
                <View style={styles.statRowHeader}>
                  <Text variant="labelLarge">{stat.title}</Text>
                  <Text variant="bodySmall">{stat.completed} / {stat.total}</Text>
                </View>
                <ProgressBar progress={stat.percentage} color="#10b981" style={styles.progressBar} />
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerText: {
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 12,
  },
  highlightSurface: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionContent: {
    paddingTop: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  statRow: {
    marginBottom: 16,
  },
  statRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  }
});
