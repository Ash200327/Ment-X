import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert as RNAlert, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button, Chip, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance, { baseURL } from '../../api/axiosInstance';
import TaskValidationLoader from '../../components/TaskValidationLoader';

export default function LeaderboardScreen() {
  const { user } = useSelector((state) => state.auth);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/leaderboard');
      setLeaderboard(res.data);
    } catch (e) {
      console.log("Failed to fetch leaderboard", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleResetScores = () => {
    RNAlert.alert(
      "Reset Scores",
      "Are you sure you want to reset all leaderboard scores? This will delete all points permanently!",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.post('/api/admin/reset-scores');
              RNAlert.alert("Success", "All scores have been reset successfully.");
              fetchLeaderboard();
            } catch (_e) {
              RNAlert.alert("Error", "Failed to reset scores.");
            }
          }
        }
      ]
    );
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return '#fbbf24'; // Gold
    if (rank === 2) return '#e2e8f0'; // Silver
    if (rank === 3) return '#fb923c'; // Bronze
    return theme.colors.primary;
  };

  const renderItem = ({ item }) => {
    const isCurrentUser = item.userId === user?.id;

    return (
      <Card style={[styles.card, isCurrentUser && styles.currentUserCard]} mode={isCurrentUser ? "elevated" : "outlined"}>
        <Card.Content style={styles.cardContent}>
          {/* Left Column: Rank & Avatar */}
          <View style={styles.rankContainer}>
            {item.eligible && item.rank <= 3 ? (
              <View style={styles.crownContainer}>
                <MaterialCommunityIcons name="crown" size={32} color={getRankBadgeColor(item.rank)} style={styles.crownIcon} />
              </View>
            ) : item.eligible ? (
              <View style={styles.textRankContainer}>
                <Text style={[styles.rankText, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                  #{item.rank}
                </Text>
              </View>
            ) : (
              <View style={styles.textRankContainer}>
                <Text style={[styles.unrankedText, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                  Unranked
                </Text>
              </View>
            )}
            
            {item.hasProfilePicture ? (
              <Avatar.Image size={46} source={{ uri: `${baseURL}/api/users/${item.userId}/avatar` }} style={[styles.avatar, { borderColor: getRankBadgeColor(item.rank) }]} />
            ) : (
              <Avatar.Text 
                size={46} 
                label={(item.name || 'U').substring(0, 2).toUpperCase()} 
                style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer, borderColor: getRankBadgeColor(item.rank) }]} 
                color={theme.colors.onPrimaryContainer}
              />
            )}
          </View>

          {/* Center Column: Details */}
          <View style={styles.detailsContainer}>
            <Text variant="titleMedium" style={styles.nameText}>
              {item.name} {isCurrentUser && <Text style={{ color: theme.colors.primary }}>(You)</Text>}
            </Text>
            
            <View style={[styles.statsRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={styles.statLabel}>Avg Score</Text>
                <Text variant="titleSmall" style={{ color: '#10b981', fontWeight: 'bold' }}>
                  {item.averageScore?.toFixed(1) || '0.0'}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={styles.statLabel}>Tasks</Text>
                <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{item.completedTasks}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={styles.statLabel}>Points</Text>
                <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {item.totalScore}
                </Text>
              </View>
            </View>

            {/* Badges */}
            <View style={styles.badgesContainer}>
              {item.topPerformer && (
                <Chip 
                  compact
                  icon={() => <MaterialCommunityIcons name="trophy" size={14} color="#f59e0b" />}
                  style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}
                  textStyle={{ color: '#d97706', fontSize: 11, fontWeight: 'bold' }}
                >
                  Top Performer
                </Chip>
              )}
              {item.consistencyBadge && (
                <Chip 
                  compact
                  icon={() => <MaterialCommunityIcons name="fire" size={14} color="#ef4444" />}
                  style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  textStyle={{ color: '#dc2626', fontSize: 11, fontWeight: 'bold' }}
                >
                  Consistent
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Leaderboard</Text>
        {user?.role === 'ADMIN' && (
          <Button 
            mode="outlined" 
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
            icon="refresh" 
            onPress={handleResetScores}
          >
            Reset
          </Button>
        )}
      </View>

      {loading && !refreshing ? (
        <TaskValidationLoader />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No participants recorded yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 12,
  },
  currentUserCard: {
    borderColor: '#6366f1',
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    marginRight: 15,
  },
  crownContainer: {
    marginBottom: -10,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textRankContainer: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    textAlign: 'center',
  },
  unrankedText: {
    color: 'gray',
    fontStyle: 'italic',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    textAlign: 'center',
  },
  avatar: {
    borderWidth: 2,
  },
  detailsContainer: {
    flex: 1,
  },
  nameText: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: 'gray',
    fontSize: 11,
    marginBottom: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
  }
});
