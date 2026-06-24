import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { theme } from '../theme';

interface LeaveRequest {
  id: string;
  studentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function LeaveApprovalsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Fetch all requests (no user_id passed)
      const response = await fetch('http://192.168.2.28:3000/api/leaves');
      const json = await response.json();
      if (json.status === 'success' && json.data) {
        // Filter out non-pending requests if you only want to show pending,
        // or show all. Let's show only pending for approvals.
        const pending = json.data.filter((r: any) => r.status === 'Pending');
        setRequests(pending.map((r: any) => ({
          id: r.id,
          studentName: 'Student ID: ' + r.user_id.substring(0, 5) + '...', // Mock name since we don't join users table
          leaveType: r.leave_type,
          startDate: r.start_date,
          endDate: r.end_date,
          reason: r.reason,
          status: r.status,
        })));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      const response = await fetch(`http://192.168.2.28:3000/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      
      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
        // Optional: show a small toast or just let the UI update silently
        Alert.alert('Success', `Request has been ${action.toLowerCase()}.`);
      } else {
        Alert.alert('Error', 'Failed to update request. Backend returned an error.');
      }
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert('Error', 'Network error while updating request.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Approvals</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending requests.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.studentName}>{item.studentName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.leaveType}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dates:</Text>
              <Text style={styles.detailValue}>
                {item.startDate} {item.startDate !== item.endDate ? `to ${item.endDate}` : ''}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={styles.detailValue}>{item.reason}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleAction(item.id, 'Rejected')}
              >
                <X color={theme.colors.destructiveText} size={20} />
                <Text style={[styles.actionButtonText, { color: theme.colors.destructiveText }]}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleAction(item.id, 'Approved')}
              >
                <Check color={theme.colors.surface} size={20} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...theme.shadows.medium,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.surface,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 60,
  },
  detailValue: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.destructive,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    marginLeft: 5,
    color: theme.colors.surface,
  },
});
