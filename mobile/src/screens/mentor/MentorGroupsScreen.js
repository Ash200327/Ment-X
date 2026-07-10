import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, TextInput, List, IconButton, useTheme, SegmentedButtons, Dialog, Portal, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance, { baseURL } from '../../api/axiosInstance';

export default function MentorGroupsScreen() {
  const theme = useTheme();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [allMentees, setAllMentees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Group creation form
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  // Add member dialog
  const [addDialogVisible, setAddDialogVisible] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      await Promise.all([
        axiosInstance.get('/api/groups')
          .then(res => setGroups(res.data))
          .catch(e => console.log(e)),
        axiosInstance.get('/api/auth/mentees')
          .then(res => setAllMentees(res.data))
          .catch(e => console.log("Failed to load mentees list", e))
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
    if (activeGroup) {
      handleSelectGroup(activeGroup);
    }
  };

  const handleSelectGroup = async (group) => {
    setActiveGroup(group);
    try {
      const res = await axiosInstance.get(`/api/groups/${group.id}/members`);
      setMembers(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch group members.');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Group Name is required.');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await axiosInstance.post('/api/groups', { groupName, description });
      Alert.alert('Success', `Group "${res.data.groupName}" created successfully.`);
      setGroupName('');
      setDescription('');
      setViewMode('list');
      setLoading(true);
      fetchAllData();
      handleSelectGroup(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to create group.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteGroup = (groupId) => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? All memberships will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`/api/groups/${groupId}`);
              Alert.alert('Success', 'Group deleted successfully.');
              if (activeGroup?.id === groupId) {
                setActiveGroup(null);
                setMembers([]);
              }
              setLoading(true);
              fetchAllData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete group.');
            }
          }
        }
      ]
    );
  };

  const handleAddMember = async (menteeId) => {
    try {
      await axiosInstance.post(`/api/groups/${activeGroup.id}/members/${menteeId}`);
      Alert.alert('Success', 'Member added to group.');
      setAddDialogVisible(false);
      handleSelectGroup(activeGroup);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = (menteeId) => {
    Alert.alert(
      "Remove Member",
      "Remove this member from the group?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`/api/groups/${activeGroup.id}/members/${menteeId}`);
              Alert.alert('Success', 'Member removed from group.');
              handleSelectGroup(activeGroup);
            } catch (e) {
              Alert.alert('Error', 'Failed to remove member.');
            }
          }
        }
      ]
    );
  };

  const renderGroupList = () => {
    if (activeGroup) {
      return (
        <View style={styles.detailsContainer}>
          <Button icon="arrow-left" mode="text" onPress={() => setActiveGroup(null)} style={{ alignSelf: 'flex-start' }}>
            Back to Groups
          </Button>
          
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Title title={activeGroup.groupName} titleStyle={{ fontWeight: 'bold' }} />
            <Card.Content>
              <Paragraph>{activeGroup.description || 'No description provided'}</Paragraph>
            </Card.Content>
          </Card>

          <View style={styles.membersHeader}>
            <Title>Members ({members.length})</Title>
            <Button mode="contained" icon="account-plus" onPress={() => setAddDialogVisible(true)}>
              Add
            </Button>
          </View>

          {members.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No members in this group yet.</Text>
          ) : (
            members.map((member) => (
              <List.Item
                key={member.id}
                title={member.name}
                description={member.email}
                left={props => 
                  member.hasProfilePicture ? (
                    <Avatar.Image {...props} size={40} source={{ uri: `${baseURL}/api/users/${member.id}/avatar` }} style={[props.style]} />
                  ) : (
                    <Avatar.Text 
                      {...props}
                      size={40} 
                      label={member.name?.substring(0, 2).toUpperCase() || 'U'}
                      style={[props.style, { backgroundColor: '#10b981' }]}
                    />
                  )
                }
                right={props => (
                  <IconButton
                    {...props}
                    icon="delete"
                    iconColor={theme.colors.error}
                    onPress={() => handleRemoveMember(member.id)}
                  />
                )}
                style={[styles.listItem, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}
              />
            ))
          )}
        </View>
      );
    }

    return (
      <View>
        {groups.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No groups created yet.</Text>
        ) : (
          groups.map(group => (
            <Card 
              key={group.id} 
              style={[styles.card, { backgroundColor: theme.colors.surface }]} 
              mode="outlined"
              onPress={() => handleSelectGroup(group)}
            >
              <Card.Title 
                title={group.groupName}
                right={(props) => (
                  <IconButton
                    {...props}
                    icon="delete"
                    iconColor={theme.colors.error}
                    onPress={() => handleDeleteGroup(group.id)}
                  />
                )}
              />
            </Card>
          ))
        )}
      </View>
    );
  };

  const renderCreateGroup = () => {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Title title="Create New Group" />
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <Button 
            mode="contained" 
            icon="group" 
            onPress={handleCreateGroup}
            loading={createLoading}
            disabled={createLoading}
            style={{ marginTop: 8 }}
          >
            Create Group
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={viewMode}
        onValueChange={setViewMode}
        buttons={[
          { value: 'list', label: 'My Groups', icon: 'format-list-bulleted' },
          { value: 'create', label: 'Create Group', icon: 'plus' },
        ]}
        style={styles.segmentedButton}
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {viewMode === 'list' ? renderGroupList() : renderCreateGroup()}
      </ScrollView>

      {/* Add Member Dialog */}
      <Portal>
        <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
          <Dialog.Title>Add Mentee to Group</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400 }}>
            <ScrollView>
              {allMentees
                .filter(m => !members.some(mem => mem.id === m.id))
                .map((mentee) => (
                  <List.Item
                    key={mentee.id}
                    title={mentee.name}
                    description={mentee.email}
                    onPress={() => handleAddMember(mentee.id)}
                    right={props => <List.Icon {...props} icon="plus" />}
                  />
              ))}
              {allMentees.filter(m => !members.some(mem => mem.id === m.id)).length === 0 && (
                <Text style={{ padding: 16, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>No mentees available to add.</Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedButton: {
    margin: 16,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
  input: {
    marginBottom: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  listItem: {
    borderBottomWidth: 1,
  }
});
