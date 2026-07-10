import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Portal, Dialog, TextInput, SegmentedButtons, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../../api/axiosInstance';

export default function ReviewScreen() {
  const theme = useTheme();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [remark, setRemark] = useState('');
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [score, setScore] = useState('10');

  // Manual Score Dialog State
  const [manualScoreDialogOpen, setManualScoreDialogOpen] = useState(false);
  const [targetMenteeId, setTargetMenteeId] = useState('');
  const [manualWeekNumber, setManualWeekNumber] = useState('1');
  const [manualScore, setManualScore] = useState('10');
  const [manualScoreMode, setManualScoreMode] = useState('override');
  const [manualLoading, setManualLoading] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await axiosInstance.get('/api/tasks/mentor/assignments');
      const sorted = res.data.sort((a, b) => {
        if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
        if (a.status !== 'SUBMITTED' && b.status === 'SUBMITTED') return 1;
        return 0;
      });
      setAssignments(sorted);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to fetch task submissions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssignments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleOpenManualScore = () => {
    setManualScoreDialogOpen(true);
  };

  const handleAssignManualScore = async () => {
    if (!targetMenteeId) return Alert.alert("Validation", "Please select a mentee ID");
    if (!manualWeekNumber) return Alert.alert("Validation", "Please enter a week number");
    
    setManualLoading(true);
    try {
      const payload = {
        menteeId: targetMenteeId,
        weekNumber: parseInt(manualWeekNumber),
        score: parseInt(manualScore),
        override: manualScoreMode === 'override'
      };
      await axiosInstance.post('/api/reviews/manual', payload);
      Alert.alert("Success", "Manual score assigned successfully");
      setManualScoreDialogOpen(false);
      
      // Reset
      setTargetMenteeId('');
      setManualWeekNumber('1');
      setManualScore('10');
      setManualScoreMode('override');
      
      fetchAssignments();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to assign manual score");
    } finally {
      setManualLoading(false);
    }
  };

  const handleOpenReview = async (assignment) => {
    setSelectedAssignment(assignment);
    setRemark('');
    setReviewStatus('APPROVED');
    setScore('10');
    
    try {
      const [updateRes, scoreRes] = await Promise.allSettled([
        axiosInstance.get(`/api/updates/assignments/${assignment.id}`),
        axiosInstance.get(`/api/reviews/assignments/${assignment.id}/score`)
      ]);

      if (updateRes.status === 'fulfilled') {
        setSelectedUpdate(updateRes.value.data);
        if (updateRes.value.data?.id) {
          try {
            const remarkRes = await axiosInstance.get(`/api/reviews/updates/${updateRes.value.data.id}/remark`);
            setRemark(remarkRes.data.remark);
            setReviewStatus(remarkRes.data.reviewStatus);
          } catch(_e) {}
        }
      } else {
        throw new Error("Failed to load submission update");
      }

      if (scoreRes.status === 'fulfilled' && scoreRes.value.data?.score !== undefined) {
        setScore(scoreRes.value.data.score.toString());
      }

      setDialogOpen(true);
    } catch (_e) {
      Alert.alert("Error", "Failed to load submission details or no submission was found");
      setSelectedAssignment(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!remark.trim()) return Alert.alert("Validation", "Please write a remark comment");
    
    try {
      const payload = {
        remark,
        reviewStatus,
        score: reviewStatus === 'APPROVED' ? parseInt(score) : 0
      };
      await axiosInstance.post(`/api/reviews/updates/${selectedUpdate.id}`, payload);
      Alert.alert("Success", "Submission reviewed successfully");
      setDialogOpen(false);
      fetchAssignments();
    } catch (_e) {
      Alert.alert("Error", "Failed to submit review");
    }
  };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED') return '#10b981';
    if (status === 'SUBMITTED') return '#3b82f6';
    if (status === 'NEEDS_IMPROVEMENT') return '#f59e0b';
    return theme.colors.onSurfaceVariant;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerText}>Submissions Review</Text>
          <Button 
            mode="contained-tonal" 
            onPress={handleOpenManualScore} 
            style={{ marginTop: 16 }}
            icon="plus"
          >
            Assign Manual Score
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content style={{ paddingHorizontal: 0 }}>
            {assignments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>No tasks assigned yet.</Text>
              </View>
            ) : (
              assignments.map((row) => (
                <View key={row.id} style={[styles.listItem, row.status === 'SUBMITTED' && { backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}>
                  <View style={{ flex: 1, paddingHorizontal: 16 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{row.mentee.name}</Text>
                    <Text variant="bodyMedium">{row.task.title}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Week {row.task.weekNumber} • <Text style={{ color: getStatusColor(row.status), fontWeight: 'bold' }}>{row.status}</Text>
                    </Text>
                  </View>
                  <View style={{ paddingRight: 16, justifyContent: 'center' }}>
                    {['SUBMITTED', 'COMPLETED', 'NEEDS_IMPROVEMENT'].includes(row.status) ? (
                      <Button 
                        mode={row.status === 'SUBMITTED' ? "contained" : "outlined"} 
                        compact
                        onPress={() => handleOpenReview(row)}
                      >
                        {row.status === 'SUBMITTED' ? 'Review Now' : 'Re-Review'}
                      </Button>
                    ) : (
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>No submission</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Review Dialog */}
      <Portal>
        <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>Review Submission</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 60 }}>
              {selectedAssignment && selectedUpdate && (
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>{selectedAssignment.task.title}</Text>
                  <Text variant="bodySmall" color={theme.colors.onSurfaceVariant}>Submitted By: {selectedAssignment.mentee.name}</Text>
                  
                  <View style={{ marginVertical: 16, padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                    <Text variant="labelLarge" style={{ color: '#10b981', marginBottom: 8 }}>
                      Completion: {selectedUpdate.completionPercentage}%
                    </Text>
                    
                    <Text variant="labelMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>Summary:</Text>
                    <Text variant="bodyMedium" style={{ marginBottom: 8 }}>{selectedUpdate.summary}</Text>
                    
                    <Text variant="labelMedium" style={{ fontWeight: 'bold', marginTop: 8 }}>Challenges:</Text>
                    <Text variant="bodyMedium">{selectedUpdate.challenges || 'None reported'}</Text>
                  </View>

                  <Divider style={{ marginVertical: 16 }} />

                  <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>Grade & Remarks</Text>
                  
                  <SegmentedButtons
                    value={reviewStatus}
                    onValueChange={setReviewStatus}
                    buttons={[
                      { value: 'APPROVED', label: 'Approve' },
                      { value: 'NEEDS_IMPROVEMENT', label: 'Needs Changes' },
                    ]}
                    style={{ marginBottom: 16 }}
                  />

                  {reviewStatus === 'APPROVED' && (
                    <TextInput
                      mode="outlined"
                      label="Score (0-10)"
                      value={score}
                      onChangeText={setScore}
                      keyboardType="numeric"
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <TextInput
                    mode="outlined"
                    label="Remarks / Comments"
                    value={remark}
                    onChangeText={setRemark}
                    multiline
                    numberOfLines={4}
                    style={{ marginBottom: 16 }}
                  />
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogOpen(false)}>Cancel</Button>
            <Button onPress={handleSubmitReview} mode="contained">Submit Review</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Manual Score Dialog */}
      <Portal>
        <Dialog visible={manualScoreDialogOpen} onDismiss={() => setManualScoreDialogOpen(false)}>
          <Dialog.Title>Assign Manual Score</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Mentee ID"
              value={targetMenteeId}
              onChangeText={setTargetMenteeId}
              keyboardType="numeric"
              style={{ marginBottom: 12 }}
              placeholder="Enter Mentee ID"
            />
            <TextInput
              mode="outlined"
              label="Week Number"
              value={manualWeekNumber}
              onChangeText={setManualWeekNumber}
              keyboardType="numeric"
              style={{ marginBottom: 12 }}
            />
            
            <Text variant="bodySmall" style={{ marginTop: 8, marginBottom: 8 }}>Score Mode:</Text>
            <SegmentedButtons
              value={manualScoreMode}
              onValueChange={setManualScoreMode}
              buttons={[
                { value: 'override', label: 'Override' },
                { value: 'add', label: 'Add to Total' },
              ]}
              style={{ marginBottom: 12 }}
            />

            <TextInput
              mode="outlined"
              label="Score"
              value={manualScore}
              onChangeText={setManualScore}
              keyboardType="numeric"
              style={{ marginBottom: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setManualScoreDialogOpen(false)}>Cancel</Button>
            <Button onPress={handleAssignManualScore} loading={manualLoading} mode="contained">Assign</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    marginBottom: 32,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  }
});
