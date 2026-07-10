import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, SegmentedButtons, IconButton, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../../api/axiosInstance';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function UserApprovalScreen() {
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState('pending'); // 'pending' or 'all'

  const fetchUsers = useCallback(async () => {
    try {
      let url = tabValue === 'pending' ? '/api/admin/pending-verifications' : '/api/admin/users';
      const res = await axiosInstance.get(url);
      setUsers(res.data);
    } catch (_e) {
      console.log(_e);
      Alert.alert("Error", "Failed to fetch user accounts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tabValue]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUsers();
    }, [fetchUsers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleVerify = async (id) => {
    try {
      await axiosInstance.post(`/api/admin/verify/${id}`);
      Alert.alert("Success", "User account approved");
      fetchUsers();
    } catch (_e) {
      Alert.alert("Error", "Failed to approve user");
    }
  };

  const handleReject = (id) => {
    Alert.alert("Confirm Rejection", "Are you sure you want to reject this registration?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
          try {
            await axiosInstance.post(`/api/admin/reject/${id}`);
            Alert.alert("Success", "User rejected");
            fetchUsers();
          } catch (_e) {
            Alert.alert("Error", "Failed to reject");
          }
      }}
    ]);
  };

  const handleSuspend = (id) => {
    Alert.alert("Confirm Suspension", "Are you sure you want to suspend this user? They will not be able to log in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Suspend", style: "destructive", onPress: async () => {
          try {
            await axiosInstance.post(`/api/admin/suspend/${id}`);
            Alert.alert("Success", "User suspended");
            fetchUsers();
          } catch (_e) {
            Alert.alert("Error", "Failed to suspend");
          }
      }}
    ]);
  };

  const handleActivate = async (id) => {
    try {
      await axiosInstance.post(`/api/admin/activate/${id}`);
      Alert.alert("Success", "User activated");
      fetchUsers();
    } catch (_e) {
      Alert.alert("Error", "Failed to activate user");
    }
  };

  const handleDelete = (id) => {
    Alert.alert("CRITICAL WARNING", "Are you sure you want to delete this user permanently? This will remove all their records!", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await axiosInstance.delete(`/api/admin/delete/${id}`);
            Alert.alert("Success", "User deleted");
            fetchUsers();
          } catch (_e) {
            Alert.alert("Error", "Failed to delete user");
          }
      }}
    ]);
  };

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return '#10b981';
    if (status === 'PENDING_VERIFICATION') return '#f59e0b';
    if (status === 'REJECTED') return '#ef4444';
    return '#6b7280'; // SUSPENDED
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>User Management</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <SegmentedButtons
          value={tabValue}
          onValueChange={setTabValue}
          buttons={[
            { value: 'pending', label: 'Pending Approvals' },
            { value: 'all', label: 'All Users' },
          ]}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView 
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        >
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>No accounts found.</Text>
            </View>
          ) : (
            users.map((row) => (
              <Card key={row.id} style={[styles.userCard, { borderLeftColor: getStatusColor(row.status), borderLeftWidth: 4 }]}>
                <Card.Title
                  title={row.name}
                  subtitle={row.email}
                  left={(props) => <Avatar.Text {...props} size={40} label={(row.name || 'U').substring(0, 2).toUpperCase()} style={{backgroundColor: theme.colors.primaryContainer}} color={theme.colors.onPrimaryContainer} />}
                  titleStyle={{ fontWeight: 'bold' }}
                />
                <Card.Content>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                    <View style={[styles.badge, { borderColor: row.role === 'MENTOR' ? theme.colors.primary : theme.colors.secondary }]}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: row.role === 'MENTOR' ? theme.colors.primary : theme.colors.secondary }}>{row.role}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${getStatusColor(row.status)}22`, borderColor: `${getStatusColor(row.status)}44` }]}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: getStatusColor(row.status) }}>{row.status}</Text>
                    </View>
                  </View>
                </Card.Content>

                <Card.Actions>
                  {row.status === 'PENDING_VERIFICATION' && (
                    <>
                      <Button mode="outlined" compact textColor="#ef4444" style={{ borderColor: '#ef4444' }} icon="close" onPress={() => handleReject(row.id)}>
                        Reject
                      </Button>
                      <Button mode="contained" compact buttonColor="#10b981" icon="check" onPress={() => handleVerify(row.id)}>
                        Approve
                      </Button>
                    </>
                  )}
                  
                  {row.role !== 'ADMIN' && row.status === 'APPROVED' && (
                    <Button mode="outlined" compact textColor="#f59e0b" style={{ borderColor: '#f59e0b' }} icon="cancel" onPress={() => handleSuspend(row.id)}>
                      Suspend
                    </Button>
                  )}

                  {row.role !== 'ADMIN' && row.status === 'SUSPENDED' && (
                    <Button mode="contained" compact buttonColor="#10b981" icon="check" onPress={() => handleActivate(row.id)}>
                      Activate
                    </Button>
                  )}

                  {row.role !== 'ADMIN' && (
                    <IconButton icon="delete" iconColor="#ef4444" size={20} onPress={() => handleDelete(row.id)} />
                  )}
                </Card.Actions>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
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
    paddingTop: 16,
  },
  headerText: {
    fontWeight: 'bold',
  },
  userCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  }
});
