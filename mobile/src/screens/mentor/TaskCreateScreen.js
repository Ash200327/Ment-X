import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Text, Card, TextInput, Button, SegmentedButtons, useTheme, IconButton, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../../api/axiosInstance';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TaskValidationLoader from '../../components/TaskValidationLoader';
import { Picker } from '@react-native-picker/picker'; // We need a dropdown for selections
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TaskCreateScreen() {
  const theme = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weekNumber, setWeekNumber] = useState('1');
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState('MEDIUM');
  const [assignType, setAssignType] = useState('group');
  const [groupId, setGroupId] = useState('');
  const [menteeId, setMenteeId] = useState('');

  const [groups, setGroups] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [mentorTasks, setMentorTasks] = useState([]);
  const [mentorAssignments, setMentorAssignments] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [editingTaskId, setEditingTaskId] = useState(null);

  const fetchOptions = async () => {
    try {
      const [groupsRes, menteesRes, tasksRes, assignmentsRes] = await Promise.all([
        axiosInstance.get('/api/groups'),
        axiosInstance.get('/api/auth/mentees'),
        axiosInstance.get('/api/tasks/mentor'),
        axiosInstance.get('/api/tasks/mentor/assignments')
      ]);
      setGroups(groupsRes.data);
      setMentees(menteesRes.data);
      setMentorTasks(tasksRes.data);
      setMentorAssignments(assignmentsRes.data);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to load task options");
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOptions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOptions();
  };

  const getGroupTasksReference = () => {
    if (!groupId) return [];
    const filtered = mentorAssignments.filter(row => row.task.group && row.task.group.id === parseInt(groupId));
    const uniqueTasks = [];
    const seenTaskIds = new Set();
    for (const item of filtered) {
      if (!seenTaskIds.has(item.task.id)) {
        seenTaskIds.add(item.task.id);
        uniqueTasks.push(item.task);
      }
    }
    return uniqueTasks.sort((a, b) => b.weekNumber - a.weekNumber);
  };

  const getIndividualTasksReference = () => {
    if (!menteeId) return [];
    const filtered = mentorAssignments.filter(row => !row.task.group && row.mentee?.id === parseInt(menteeId));
    const uniqueTasks = [];
    const seenTaskIds = new Set();
    for (const item of filtered) {
      if (!seenTaskIds.has(item.task.id)) {
        seenTaskIds.add(item.task.id);
        uniqueTasks.push(item.task);
      }
    }
    return uniqueTasks.sort((a, b) => b.weekNumber - a.weekNumber);
  };

  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setWeekNumber(task.weekNumber.toString());
    
    // Formatting date string to simple local for now
    let formattedDeadline = '';
    if (task.deadline) {
      formattedDeadline = task.deadline.includes('T') ? task.deadline.slice(0, 16) : task.deadline;
    }
    setDeadline(formattedDeadline);
    setPriority(task.priority);
    
    if (task.group) {
      setAssignType('group');
      setGroupId(task.group.id);
    } else {
      setAssignType('individual');
      setMenteeId('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setWeekNumber('1');
    setDeadline('');
    setGroupId('');
    setMenteeId('');
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this task? This deletes all associated assignments and reviews.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`/api/tasks/${taskId}`);
              Alert.alert("Success", "Task deleted successfully");
              if (editingTaskId === taskId) handleCancelEdit();
              fetchOptions();
            } catch (_e) {
              Alert.alert("Error", "Failed to delete task");
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!title) return Alert.alert("Validation Error", "Title is required");
    if (!deadline) return Alert.alert("Validation Error", "Deadline is required");
    
    if (!editingTaskId) {
      if (assignType === 'group' && !groupId) return Alert.alert("Validation Error", "Please select a group");
      if (assignType === 'individual' && !menteeId) return Alert.alert("Validation Error", "Please select a mentee");
    }

    setLoading(true);
    try {
      const formattedDeadline = deadline ? (deadline.includes('T') ? deadline : `${deadline}T23:59:00`) : null;

      const payload = {
        title,
        description,
        weekNumber: parseInt(weekNumber) || 1,
        deadline: formattedDeadline,
        priority,
        groupId: assignType === 'group' ? groupId : null,
        menteeId: assignType === 'individual' ? menteeId : null
      };

      if (editingTaskId) {
        await axiosInstance.put(`/api/tasks/${editingTaskId}`, payload);
        Alert.alert("Success", "Task updated successfully");
        setEditingTaskId(null);
      } else {
        await axiosInstance.post('/api/tasks', payload);
        Alert.alert("Success", "Task assigned successfully");
      }

      handleCancelEdit(); // clears form
      fetchOptions();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p) => {
    if (p === 'HIGH') return '#ef4444';
    if (p === 'MEDIUM') return '#f59e0b';
    return '#3b82f6';
  };

  const renderDescription = (text) => {
    if (!text) return 'No description provided.';
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text 
            key={index} 
            style={{ color: '#3b82f6', textDecorationLine: 'underline' }} 
            onPress={async () => {
              try {
                await Linking.openURL(part);
              } catch (_e) {
                Alert.alert("Error", "Failed to open link");
              }
            }}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  if (pageLoading) {
    return <TaskValidationLoader />;
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerText}>Manage Tasks</Text>
        </View>

        {/* Task Form */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={{ marginBottom: 16 }}>
              {editingTaskId ? 'Edit Task' : 'Assign New Task'}
            </Text>

            <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>Assign To</Text>
            <SegmentedButtons
              value={assignType}
              onValueChange={setAssignType}
              buttons={[
                { value: 'group', label: 'Group', disabled: !!editingTaskId && assignType !== 'group' },
                { value: 'individual', label: 'Individual', disabled: !!editingTaskId && assignType !== 'individual' },
              ]}
              style={{ marginBottom: 16 }}
            />

            {!editingTaskId && (
              <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                <Text style={{ color: theme.colors.primary, marginBottom: 8, paddingHorizontal: 8 }}>
                  {assignType === 'group' ? "Select Group:" : "Select Mentee:"}
                </Text>
                <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
                  {assignType === 'group' ? (
                    <Picker
                      selectedValue={groupId}
                      onValueChange={(itemValue) => setGroupId(itemValue)}
                      style={{ color: theme.colors.onSurface }}
                      dropdownIconColor={theme.colors.onSurface}
                    >
                      <Picker.Item label="Select a Group" value="" />
                      {groups.map((g) => (
                        <Picker.Item key={g.id} label={g.groupName} value={g.id} />
                      ))}
                    </Picker>
                  ) : (
                    <Picker
                      selectedValue={menteeId}
                      onValueChange={(itemValue) => setMenteeId(itemValue)}
                      style={{ color: theme.colors.onSurface }}
                      dropdownIconColor={theme.colors.onSurface}
                    >
                      <Picker.Item label="Select a Mentee" value="" />
                      {mentees.map((m) => (
                        <Picker.Item key={m.id} label={`${m.name} (${m.email})`} value={m.id} />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>
            )}

            <TextInput
              mode="outlined"
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Task Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="Week Number"
                value={weekNumber}
                onChangeText={setWeekNumber}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                mode="outlined"
                label="Priority"
                value={priority}
                onChangeText={setPriority}
                style={[styles.input, { flex: 1 }]}
                placeholder="HIGH/MEDIUM/LOW"
              />
            </View>

            {Platform.OS === 'web' ? (
              <TextInput
                mode="outlined"
                label="Deadline (YYYY-MM-DD)"
                value={deadline}
                onChangeText={setDeadline}
                style={styles.input}
              />
            ) : (
              <View>
                <TextInput
                  mode="outlined"
                  label="Deadline"
                  value={deadline}
                  style={styles.input}
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                  onFocus={() => setShowDatePicker(true)}
                  showSoftInputOnFocus={false}
                />
                {showDatePicker && (
                  <DateTimePicker
                    value={deadline && !isNaN(new Date(deadline).getTime()) ? new Date(deadline) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setDeadline(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                  />
                )}
              </View>
            )}

            <View style={styles.actionButtons}>
              {editingTaskId && (
                <Button 
                  mode="outlined" 
                  onPress={handleCancelEdit} 
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Cancel
                </Button>
              )}
              <Button 
                mode="contained" 
                onPress={handleSubmit} 
                loading={loading}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {editingTaskId ? 'Update' : 'Assign'}
              </Button>
            </View>

          </Card.Content>
        </Card>

        {/* Previous Work Panel */}
        <Card style={styles.card}>
          <Card.Title 
            title="Previous Work Reference" 
            subtitle={
              assignType === 'group' && groupId ? `Group: ${groups.find(g => g.id === parseInt(groupId))?.groupName || ''}` :
              assignType === 'individual' && menteeId ? `Mentee: ${mentees.find(m => m.id === parseInt(menteeId))?.name || ''}` :
              'No Target Selected'
            }
            left={(props) => <MaterialCommunityIcons name="history" size={24} color={theme.colors.secondary} />} 
          />
          <Divider />
          <Card.Content style={{ paddingTop: 8, paddingHorizontal: 0 }}>
            {!(assignType === 'group' && groupId) && !(assignType === 'individual' && menteeId) ? (
              <View style={styles.emptyState}>
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  Select a group or mentee above to view their previously assigned tasks.
                </Text>
              </View>
            ) : (assignType === 'group' ? getGroupTasksReference() : getIndividualTasksReference()).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>No previous tasks found.</Text>
              </View>
            ) : (
              (assignType === 'group' ? getGroupTasksReference() : getIndividualTasksReference()).slice(0, 1).map((task) => (
                <View key={task.id} style={[styles.taskItem, { paddingHorizontal: 16, borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>{task.title}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>{renderDescription(task.description)}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <Text variant="labelMedium" style={{ color: theme.colors.primary, marginRight: 12 }}>Week {task.weekNumber}</Text>
                      <Text variant="labelMedium" style={{ color: getPriorityColor(task.priority) }}>{task.priority} Priority</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Existing Tasks List */}
        <Card style={[styles.card, { marginBottom: 40 }]}>
          <Card.Title 
            title="Tasks Issued By You" 
            left={(props) => <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={theme.colors.primary} />} 
          />
          <Divider />
          <Card.Content style={{ paddingTop: 8 }}>
            {mentorTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>No tasks assigned yet.</Text>
              </View>
            ) : (
              mentorTasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{task.title}</Text>
                    </View>
                    <Text variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                      Week {task.weekNumber} • {task.group ? 'Group' : 'Individual'} • Priority: <Text style={{ color: getPriorityColor(task.priority), fontWeight: 'bold' }}>{task.priority}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="pencil" size={20} iconColor={theme.colors.primary} onPress={() => handleEditClick(task)} />
                    <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => handleDeleteTask(task.id)} />
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  pickerContainer: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  }
});
