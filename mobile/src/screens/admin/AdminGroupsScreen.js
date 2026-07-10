import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator, useTheme, Divider, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance, { baseURL } from '../../api/axiosInstance';

export default function AdminGroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/groups/all');
      setGroups(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title style={styles.headerTitle}>Group Administrations</Title>
      
      {groups.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No groups have been created yet.</Text>
      ) : (
        groups.map((group) => (
          <Card key={group.id} style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Title
              title={group.groupName}
              titleStyle={{ fontWeight: 'bold' }}
              subtitle={`Created: ${new Date(group.createdAt).toLocaleDateString()}`}
            />
            <Card.Content>
              <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                {group.description || 'No description provided.'}
              </Paragraph>
              
              <Divider style={styles.divider} />
              
              <View style={styles.mentorInfo}>
                {group.mentor?.hasProfilePicture ? (
                  <Avatar.Image size={40} source={{ uri: `${baseURL}/api/users/${group.mentor.id}/avatar` }} />
                ) : (
                  <Avatar.Text 
                    size={40} 
                    label={(group.mentor?.name || 'M').substring(0, 2).toUpperCase()} 
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
                <View style={styles.mentorTextContainer}>
                  <Text style={[styles.mentorName, { color: theme.colors.onSurface }]}>{group.mentor?.name || 'Unknown Mentor'}</Text>
                  <Text style={[styles.mentorEmail, { color: theme.colors.onSurfaceVariant }]}>{group.mentor?.email}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorTextContainer: {
    marginLeft: 12,
  },
  mentorName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  mentorEmail: {
    fontSize: 14,
  },
});
