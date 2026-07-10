import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, TextInput, List, IconButton, SegmentedButtons, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  const [viewMode, setViewMode] = useState('inbox'); // 'inbox' | 'send'
  
  const [notifications, setNotifications] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Send notification form
  const [sendType, setSendType] = useState('USER'); // 'USER' | 'GROUP'
  const [targetUserId, setTargetUserId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  // Dropdown states (simulated with expanded list for mobile)
  const [recipientExpanded, setRecipientExpanded] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
      const promises = [
        axiosInstance.get('/api/notifications')
          .then(res => setNotifications(res.data))
          .catch(e => console.log("Failed to fetch notifications", e)),
        axiosInstance.get('/api/notifications/recipients')
          .then(res => setRecipients(res.data))
          .catch(e => console.log("Failed to fetch recipients list", e))
      ];
      
      if (user.role !== 'MENTEE') {
        const url = user.role === 'ADMIN' ? '/api/groups/all' : '/api/groups';
        promises.push(
          axiosInstance.get(url)
            .then(res => setGroups(res.data))
            .catch(e => console.log("Failed to fetch groups list", e))
        );
      }
      
      await Promise.all(promises);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleMarkRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
    } catch (e) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (e) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleSendNotification = async () => {
    if (sendType === 'USER' && !targetUserId) {
      Alert.alert('Error', 'Please select a recipient user.');
      return;
    }
    if (sendType === 'GROUP' && !targetGroupId) {
      Alert.alert('Error', 'Please select a recipient group.');
      return;
    }
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    setSendLoading(true);
    try {
      const payload = {
        title,
        message,
        targetUserId: sendType === 'USER' ? targetUserId : null,
        targetGroupId: sendType === 'GROUP' ? targetGroupId : null
      };
      await axiosInstance.post('/api/notifications', payload);
      Alert.alert('Success', 'Notification sent successfully!');
      setTargetUserId('');
      setTargetGroupId('');
      setTitle('');
      setMessage('');
      setViewMode('inbox');
      setLoading(true);
      fetchAllData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSendLoading(false);
    }
  };

  const hasUnread = notifications.some(n => !n.readStatus);

  const renderInbox = () => {
    if (loading && !refreshing) {
      return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;
    }

    return (
      <View style={styles.inboxContainer}>
        <View style={styles.inboxHeader}>
          <Title>My Inbox ({notifications.length})</Title>
          {hasUnread && (
            <Button mode="outlined" icon="check-all" onPress={handleMarkAllRead}>
              Mark All Read
            </Button>
          )}
        </View>

        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>Your notification inbox is empty.</Text>
        ) : (
          notifications.map((notif) => (
            <Card 
              key={notif.id} 
              style={[
                styles.notifCard, 
                { backgroundColor: notif.readStatus ? theme.colors.surface : theme.colors.secondaryContainer }
              ]} 
              mode="outlined"
            >
              <Card.Title 
                title={notif.title}
                titleStyle={{ fontWeight: notif.readStatus ? 'normal' : 'bold' }}
                subtitle={`Received: ${new Date(notif.createdAt).toLocaleString()}`}
                right={(props) => 
                  !notif.readStatus ? (
                    <IconButton
                      {...props}
                      icon="check"
                      iconColor={theme.colors.primary}
                      onPress={() => handleMarkRead(notif.id)}
                    />
                  ) : null
                }
              />
              <Card.Content>
                <Paragraph>{notif.message}</Paragraph>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    );
  };

  const renderSendForm = () => {
    const selectedRecipientName = recipients.find(r => r.id === targetUserId)?.name || (user?.role === 'MENTEE' ? 'Select Mentor' : 'Select Recipient');
    const selectedGroupName = groups.find(g => g.id === targetGroupId)?.groupName || 'Select Group';

    return (
      <Card style={styles.sendCard} mode="outlined">
        <Card.Title title={user?.role === 'MENTEE' ? 'Send to Mentor' : 'Send Custom Notification'} />
        <Card.Content>
          
          {user?.role !== 'MENTEE' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>Send To:</Text>
              <SegmentedButtons
                value={sendType}
                onValueChange={setSendType}
                buttons={[
                  { value: 'USER', label: 'Single User' },
                  { value: 'GROUP', label: 'Whole Group' },
                ]}
              />
            </View>
          )}

          {sendType === 'USER' ? (
            <List.Accordion
              title={selectedRecipientName}
              expanded={recipientExpanded}
              onPress={() => setRecipientExpanded(!recipientExpanded)}
              style={[styles.accordion, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            >
              {recipients.map(r => (
                <List.Item 
                  key={r.id} 
                  title={`${r.name} (${r.role})`} 
                  onPress={() => {
                    setTargetUserId(r.id);
                    setRecipientExpanded(false);
                  }}
                  style={{ backgroundColor: targetUserId === r.id ? theme.colors.surfaceVariant : theme.colors.surface }}
                />
              ))}
            </List.Accordion>
          ) : (
            <List.Accordion
              title={selectedGroupName}
              expanded={groupExpanded}
              onPress={() => setGroupExpanded(!groupExpanded)}
              style={[styles.accordion, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            >
              {groups.map(g => (
                <List.Item 
                  key={g.id} 
                  title={g.groupName} 
                  onPress={() => {
                    setTargetGroupId(g.id);
                    setGroupExpanded(false);
                  }}
                  style={{ backgroundColor: targetGroupId === g.id ? theme.colors.surfaceVariant : theme.colors.surface }}
                />
              ))}
            </List.Accordion>
          )}

          <TextInput
            mode="outlined"
            label="Notification Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          
          <TextInput
            mode="outlined"
            label="Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          
          <Button 
            mode="contained" 
            icon="send" 
            onPress={handleSendNotification}
            loading={sendLoading}
            disabled={sendLoading}
            style={{ marginTop: 16 }}
          >
            Send Notification
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
          { value: 'inbox', label: 'Inbox', icon: 'inbox' },
          { value: 'send', label: 'Send', icon: 'send' },
        ]}
        style={styles.segmentedButton}
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          viewMode === 'inbox' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : null
        }
      >
        {viewMode === 'inbox' ? renderInbox() : renderSendForm()}
      </ScrollView>
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
  inboxContainer: {
    flex: 1,
  },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifCard: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
  sendCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  accordion: {
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
  }
});
