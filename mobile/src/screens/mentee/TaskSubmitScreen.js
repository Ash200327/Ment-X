import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal, ScrollView, TouchableOpacity, Linking, Alert as RNAlert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, SegmentedButtons, TextInput, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';

export default function TaskSubmitScreen() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ACTIVE');
  const theme = useTheme();

  const activeAssignments = assignments.filter(r => !['SUBMITTED', 'COMPLETED'].includes(r.status));
  const pastAssignments = assignments.filter(r => ['SUBMITTED', 'COMPLETED'].includes(r.status));
  const filteredAssignments = filterType === 'ACTIVE' ? activeAssignments : pastAssignments;

  // Modals state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [summary, setSummary] = useState('');
  const [challenges, setChallenges] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [remark, setRemark] = useState(null);
  const [score, setScore] = useState(null);

  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchAssignments = async () => {
    try {
      const res = await axiosInstance.get('/api/tasks/mentee');
      setAssignments(res.data);
    } catch (e) {
      console.log("Failed to fetch assigned tasks", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssignments();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/tasks/assignments/${id}/read`);
      RNAlert.alert("Success", "Task marked as read.");
      fetchAssignments();
    } catch (e) {
      RNAlert.alert("Error", "Failed to update status.");
    }
  };

  const handleStartTask = async (id) => {
    try {
      await axiosInstance.patch(`/api/tasks/assignments/${id}/start`);
      RNAlert.alert("Success", "Task marked as In Progress.");
      fetchAssignments();
    } catch (e) {
      RNAlert.alert("Error", "Failed to update status.");
    }
  };

  const handleOpenSubmit = async (assignment) => {
    setSelectedAssignment(assignment);
    setSummary('');
    setChallenges('');
    setCompletionPercentage(50);
    
    if (['SUBMITTED', 'NEEDS_IMPROVEMENT'].includes(assignment.status)) {
      try {
        const updateRes = await axiosInstance.get(`/api/updates/assignments/${assignment.id}`);
        setSummary(updateRes.data.summary || '');
        setChallenges(updateRes.data.challenges || '');
        setCompletionPercentage(updateRes.data.completionPercentage || 50);
      } catch (e) {}
    }
    
    setSubmitDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    if (!summary.trim()) {
      RNAlert.alert("Required", "Please describe the work summary.");
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/api/updates/assignments/${selectedAssignment.id}`, {
        summary,
        challenges,
        completionPercentage
      });
      RNAlert.alert("Success", "Weekly progress update submitted!");
      fetchAssignments();
      setSubmitDialogOpen(false);
    } catch (err) {
      RNAlert.alert("Error", err.response?.data?.message || "Failed to submit weekly update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetails = async (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedUpdate(null);
    setRemark(null);
    setScore(null);
    setDetailsDialogOpen(true);

    try {
      // Parallelize update and score fetching
      const [updateRes, scoreRes] = await Promise.allSettled([
        axiosInstance.get(`/api/updates/assignments/${assignment.id}`),
        axiosInstance.get(`/api/reviews/assignments/${assignment.id}/score`)
      ]);

      if (updateRes.status === 'fulfilled') {
        setSelectedUpdate(updateRes.value.data);
        if (updateRes.value.data?.id) {
          try {
            const remarkRes = await axiosInstance.get(`/api/reviews/updates/${updateRes.value.data.id}/remark`);
            setRemark(remarkRes.data);
          } catch (e) {}
        }
      }

      if (scoreRes.status === 'fulfilled') {
        setScore(scoreRes.value.data);
      }
    } catch (e) {
      console.log("Failed to fetch submission details", e);
    }
  };

  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED' || status === 'SUBMITTED') return '#10b981';
    if (status === 'IN_PROGRESS' || status === 'NEEDS_IMPROVEMENT') return '#3b82f6';
    return '#9ca3af';
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
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
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 }]}>
      <View style={[styles.cardHeader, { backgroundColor: item.task.group ? 'rgba(99, 102, 241, 0.08)' : 'rgba(16, 185, 129, 0.08)' }]}>
        <MaterialCommunityIcons name={item.task.group ? "account-group" : "star"} size={16} color={item.task.group ? "#6366f1" : "#10b981"} />
        <Text style={[styles.cardHeaderText, { color: item.task.group ? '#6366f1' : '#10b981' }]}>
          {item.task.group ? `GROUP: ${item.task.group.groupName}` : 'SPECIALLY FOR YOU'}
        </Text>
      </View>
      <Card.Content style={{ paddingTop: 10 }}>
        <View style={styles.badgeRow}>
          <Chip compact mode="outlined" textStyle={{ fontSize: 12 }}>Week {item.task.weekNumber}</Chip>
          <Chip compact style={{ backgroundColor: `${getStatusColor(item.status)}15` }} textStyle={{ color: getStatusColor(item.status), fontWeight: 'bold', fontSize: 12 }}>
            {item.status}
          </Chip>
        </View>

        <Text variant="titleMedium" style={styles.taskTitle}>{item.task.title}</Text>
        <Text variant="bodySmall" style={[styles.taskDesc, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
          {renderDescription(item.task.description)}
        </Text>

        <View style={[styles.metaRow, { borderTopColor: theme.colors.outlineVariant }]}>
          <Text variant="labelSmall" style={{ color: 'gray' }}>Deadline: {formatDeadline(item.task.deadline)}</Text>
          <Chip compact style={{ backgroundColor: item.task.priority === 'HIGH' ? '#fee2e2' : item.task.priority === 'MEDIUM' ? '#fef3c7' : '#e0f2fe' }} textStyle={{ fontSize: 10, color: item.task.priority === 'HIGH' ? '#b91c1c' : item.task.priority === 'MEDIUM' ? '#b45309' : '#0369a1', fontWeight: 'bold' }}>
            {item.task.priority}
          </Chip>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button mode="text" compact onPress={() => handleOpenTaskDetails(item.task)}>Details</Button>
        {item.status === 'ASSIGNED' && (
          <Button mode="outlined" compact onPress={() => handleMarkRead(item.id)}>Mark Read</Button>
        )}
        {['ASSIGNED', 'VIEWED'].includes(item.status) && (
          <Button mode="contained" compact onPress={() => handleStartTask(item.id)}>Start Work</Button>
        )}
        {['IN_PROGRESS', 'NEEDS_IMPROVEMENT', 'SUBMITTED'].includes(item.status) && (
          <Button mode="contained" compact buttonColor="#6366f1" onPress={() => handleOpenSubmit(item)}>
            {item.status === 'SUBMITTED' ? 'Edit' : 'Submit'}
          </Button>
        )}
        {['SUBMITTED', 'COMPLETED', 'NEEDS_IMPROVEMENT'].includes(item.status) && (
          <Button mode="outlined" compact onPress={() => handleOpenDetails(item)}>Submission</Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <SegmentedButtons
          value={filterType}
          onValueChange={setFilterType}
          buttons={[
            { value: 'ACTIVE', label: `Active (${activeAssignments.length})` },
            { value: 'SUBMITTED', label: `Past (${pastAssignments.length})` },
          ]}
          style={{ width: '100%' }}
        />
      </View>

      <View style={styles.bannerContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ef4444" style={styles.bannerIcon} />
        <Text style={styles.bannerText}>
          <Text style={{fontWeight: 'bold', color: '#ef4444'}}>No previous task updates will lead to no newer task assignments.</Text> Please contact your mentor for any problems or discussion.
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No {filterType.toLowerCase()} tasks found.</Text>
            </View>
          }
        />
      )}

      {/* Task Details Modal */}
      <Modal visible={taskDetailsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTaskDetailsOpen(false)}>
        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Task Specifications</Text>
          <IconButton icon="close" onPress={() => setTaskDetailsOpen(false)} />
        </View>
        <ScrollView style={[styles.modalContent, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
          {selectedTask && (
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 15, color: theme.colors.onBackground }}>{selectedTask.title}</Text>
              <View style={styles.badgeRow}>
                <Chip mode="outlined">Week {selectedTask.weekNumber}</Chip>
                <Chip mode="outlined">{selectedTask.priority}</Chip>
              </View>
              <Text style={{ marginVertical: 10, color: theme.colors.onSurfaceVariant }}>Deadline: {formatDeadline(selectedTask.deadline)}</Text>
              
              <Text variant="labelLarge" style={{ marginTop: 15, marginBottom: 5, color: theme.colors.onBackground }}>Description & Instructions:</Text>
              <View style={[styles.codeBlock, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                <Text style={{ fontFamily: 'monospace', color: theme.colors.onSurfaceVariant }}>{renderDescription(selectedTask.description)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>

      {/* Submit Update Modal */}
      <Modal visible={submitDialogOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSubmitDialogOpen(false)}>
        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Submit Update</Text>
          <IconButton icon="close" onPress={() => setSubmitDialogOpen(false)} />
        </View>
        <ScrollView style={[styles.modalContent, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={{ marginBottom: 15, color: theme.colors.onSurfaceVariant }}>Provide your weekly progress for this task.</Text>
          
          <TextInput
            mode="outlined"
            label="Work Summary (Required)"
            multiline
            numberOfLines={4}
            value={summary}
            onChangeText={setSummary}
            style={{ marginBottom: 15 }}
          />

          <TextInput
            mode="outlined"
            label="Challenges Faced"
            multiline
            numberOfLines={3}
            value={challenges}
            onChangeText={setChallenges}
            style={{ marginBottom: 20 }}
          />

          <Text variant="labelLarge" style={{ marginBottom: 10 }}>Completion: {completionPercentage}%</Text>
          <View style={styles.stepperContainer}>
            <Button mode="contained-tonal" onPress={() => setCompletionPercentage(Math.max(0, completionPercentage - 5))}>-</Button>
            <View style={[styles.stepperBar, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.stepperFill, { width: `${completionPercentage}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Button mode="contained-tonal" onPress={() => setCompletionPercentage(Math.min(100, completionPercentage + 5))}>+</Button>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleSubmitUpdate} 
            loading={isSubmitting} 
            disabled={isSubmitting}
            style={{ marginTop: 30 }}
          >
            Submit Update
          </Button>
        </ScrollView>
      </Modal>

      {/* Submission Details Modal */}
      <Modal visible={detailsDialogOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailsDialogOpen(false)}>
        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Submission History</Text>
          <IconButton icon="close" onPress={() => setDetailsDialogOpen(false)} />
        </View>
        <ScrollView style={[styles.modalContent, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
          {selectedUpdate && (
            <View>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Completion Percentage</Text>
              <Text variant="headlineSmall" style={{ color: '#10b981', fontWeight: 'bold', marginBottom: 15 }}>{selectedUpdate.completionPercentage}%</Text>

              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>My Summary</Text>
              <View style={[styles.readOnlyBlock, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}><Text style={{ color: theme.colors.onSurfaceVariant }}>{selectedUpdate.summary}</Text></View>

              <Text variant="labelMedium" style={{ marginTop: 15, color: theme.colors.onSurfaceVariant }}>My Challenges</Text>
              <View style={[styles.readOnlyBlock, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}><Text style={{ color: theme.colors.onSurfaceVariant }}>{selectedUpdate.challenges || 'No challenges reported.'}</Text></View>

              <View style={{ marginVertical: 20, height: 1, backgroundColor: theme.colors.outlineVariant }} />

              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 10, color: theme.colors.onBackground }}>Mentor Assessment</Text>
              {remark ? (
                <View style={[styles.assessmentCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                  <Chip style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: remark.reviewStatus === 'APPROVED' ? '#dcfce7' : '#fef3c7' }}>
                    {remark.reviewStatus}
                  </Chip>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Remarks:</Text>
                  <Text style={{ marginBottom: 10, fontWeight: '500', color: theme.colors.onSurface }}>"{remark.remark}"</Text>
                  
                  {score && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="star" size={20} color={theme.colors.primary} />
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', marginLeft: 5, color: theme.colors.onSurface }}>{score.score} / 10</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={{ fontStyle: 'italic', color: theme.colors.onSurfaceVariant }}>Pending review from your mentor.</Text>
              )}
            </View>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 15,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 15,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cardHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  taskTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  taskDesc: {
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cardActions: {
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  codeBlock: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBar: {
    flex: 1,
    height: 10,
    marginHorizontal: 15,
    borderRadius: 5,
    overflow: 'hidden',
  },
  stepperFill: {
    height: '100%',
  },
  readOnlyBlock: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 5,
  },
  assessmentCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
  },
  bannerContainer: {
    flexDirection: 'row',
    margin: 15,
    marginBottom: 0,
    padding: 15,
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: 10,
  },
  bannerText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 13,
  }
});
