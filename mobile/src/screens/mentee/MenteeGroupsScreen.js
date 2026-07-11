import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, useTheme, Divider, Avatar, List } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance, { baseURL } from '../../api/axiosInstance';
import TaskValidationLoader from '../../components/TaskValidationLoader';

export default function MenteeGroupsScreen({ route }) {
  // In a real app we might use Redux, but for mobile we often rely on context or just visually indicate 'You' via props if needed.
  // We'll just list all members here.
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const fetchMyGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/groups/my-groups');
      setGroups(res.data);
      setError('');
    } catch (_e) {
      setError("Failed to fetch group details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyGroups();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyGroups();
  };

  if (loading && !refreshing) {
    return <TaskValidationLoader />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title style={styles.headerTitle}>My Group Associations</Title>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      {groups.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
          <Card.Content>
            <Title style={{ textAlign: 'center' }}>No Groups Found</Title>
            <Paragraph style={{ textAlign: 'center', marginTop: 8, color: theme.colors.onSurfaceVariant }}>
              You haven{"'"}t been added to any mentorship groups yet. Please contact your mentor or administrator.
            </Paragraph>
          </Card.Content>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id} style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Title
              title={group.groupName}
              titleStyle={{ fontWeight: 'bold' }}
            />
            <Card.Content>
              <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                {group.description || 'No description provided for this group.'}
              </Paragraph>
              
              <Divider style={styles.divider} />
              
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>Group Mentor</Text>
              <View style={styles.mentorInfo}>
                {group.mentor?.hasProfilePicture ? (
                  <Avatar.Image size={50} source={{ uri: `${baseURL}/api/users/${group.mentor.id}/avatar` }} />
                ) : (
                  <Avatar.Text 
                    size={50} 
                    label={(group.mentor?.name || 'M').substring(0, 2).toUpperCase()} 
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
                <View style={styles.mentorTextContainer}>
                  <Text style={[styles.mentorName, { color: theme.colors.onSurface }]}>{group.mentor?.name || 'Unknown Mentor'}</Text>
                  <Text style={[styles.mentorEmail, { color: theme.colors.onSurfaceVariant }]}>{group.mentor?.email}</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>Fellow Group Mentees</Text>
              {group.members && group.members.length > 0 ? (
                group.members.map(member => (
                  <List.Item
                    key={member.id}
                    title={member.name}
                    description={member.email}
                    left={props => 
                      member.profilePicture ? (
                        <Avatar.Image {...props} size={40} source={{ uri: member.profilePicture }} style={[props.style]} />
                      ) : (
                        <Avatar.Text 
                          {...props}
                          size={40} 
                          label={(member.name || 'U').substring(0, 2).toUpperCase()}
                          style={[props.style, { backgroundColor: '#10b981' }]}
                        />
                      )
                    }
                  />
                ))
              ) : (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No other members.</Text>
              )}
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
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyCard: {
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
  sectionTitle: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontSize: 12,
  },
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mentorTextContainer: {
    marginLeft: 16,
  },
  mentorName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  mentorEmail: {
    fontSize: 14,
  },
  emptyText: {
    fontStyle: 'italic',
  }
});
