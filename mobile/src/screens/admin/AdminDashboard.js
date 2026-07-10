import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, List, Divider } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axiosInstance from '../../api/axiosInstance';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function AdminDashboard() {
  const theme = useTheme();
  const navigation = useNavigation();

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axiosInstance.get('/api/admin/stats'),
        axiosInstance.get('/api/admin/audit-logs')
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data.slice(0, 10)); // Display top 10
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
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

  const getLogIcon = (action) => {
    if (action.includes('CREATED') || action.includes('REGISTERED')) return 'account-plus';
    if (action.includes('VERIFIED')) return 'check-decagram';
    if (action.includes('DELETED')) return 'delete';
    return 'history';
  };

  const getLogColor = (action) => {
    if (action.includes('CREATED') || action.includes('VERIFIED')) return '#10b981';
    if (action.includes('DELETED') || action.includes('REJECTED')) return '#ef4444';
    return theme.colors.primary;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>Admin Dashboard</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Card style={[styles.summaryCard, { borderLeftColor: '#6366f1', borderLeftWidth: 4 }]}>
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Active Mentors</Text>
              <Text variant="headlineMedium" style={styles.statValue}>{stats?.totalMentors || 0}</Text>
            </View>
            <MaterialCommunityIcons name="account-tie" size={36} color="#6366f1" style={{ opacity: 0.9 }} />
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, { borderLeftColor: '#10b981', borderLeftWidth: 4 }]}>
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Active Mentees</Text>
              <Text variant="headlineMedium" style={styles.statValue}>{stats?.totalMentees || 0}</Text>
            </View>
            <MaterialCommunityIcons name="school" size={36} color="#10b981" style={{ opacity: 0.9 }} />
          </Card.Content>
        </Card>

        <Card 
          style={[styles.summaryCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }, stats?.pendingVerifications > 0 && styles.highlightSurface]}
          onPress={() => navigation.navigate('UserApprovalScreen')}
        >
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending Approvals</Text>
              <Text variant="headlineMedium" style={styles.statValue}>{stats?.pendingVerifications || 0}</Text>
            </View>
            <MaterialCommunityIcons name="account-clock" size={36} color="#f59e0b" style={{ opacity: 0.9 }} />
          </Card.Content>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Card style={[styles.summaryCard, { flex: 1, marginRight: 6, borderLeftColor: '#0ea5e9', borderLeftWidth: 4 }]}>
            <Card.Content style={styles.cardContent}>
              <View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Groups</Text>
                <Text variant="titleLarge" style={styles.statValue}>{stats?.totalGroups || 0}</Text>
              </View>
              <MaterialCommunityIcons name="account-group" size={24} color="#0ea5e9" style={{ opacity: 0.9 }} />
            </Card.Content>
          </Card>
          
          <Card style={[styles.summaryCard, { flex: 1, marginLeft: 6, borderLeftColor: '#a855f7', borderLeftWidth: 4 }]}>
            <Card.Content style={styles.cardContent}>
              <View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Tasks</Text>
                <Text variant="titleLarge" style={styles.statValue}>{stats?.totalTasks || 0}</Text>
              </View>
              <MaterialCommunityIcons name="clipboard-text" size={24} color="#a855f7" style={{ opacity: 0.9 }} />
            </Card.Content>
          </Card>
        </View>
      </View>

      <Card style={[styles.sectionCard, { marginBottom: 30 }]}>
        <Card.Title 
          title="System Audit Logs" 
          left={(props) => <MaterialCommunityIcons name="history" size={24} color={theme.colors.primary} />} 
        />
        <Divider />
        <Card.Content style={{ paddingTop: 8, paddingHorizontal: 0 }}>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={48} color={theme.colors.primary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic' }}>No activities logged yet.</Text>
            </View>
          ) : (
            logs.map((log) => (
              <List.Item
                key={log.id}
                title={log.action}
                description={`${log.username} - ${log.details}`}
                left={props => <List.Icon {...props} icon={getLogIcon(log.action)} color={getLogColor(log.action)} />}
                right={props => (
                  <View style={{ justifyContent: 'center' }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                style={styles.listItem}
                titleStyle={{ fontWeight: 'bold', fontSize: 14 }}
              />
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
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  }
});
