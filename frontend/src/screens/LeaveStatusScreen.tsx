import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react-native';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';

interface LeaveRecord {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

export default function LeaveStatusScreen() {
  const navigation = useNavigation();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://192.168.2.28:3000/api/leaves?user_id=${session.user.id}`);
      const result = await response.json();

      if (response.ok && result.data) {
        // Sort by start_date descending
        const sortedData = result.data.sort((a: LeaveRecord, b: LeaveRecord) => {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
        setLeaves(sortedData);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    let bgColor = '#FFF3E0';
    let textColor = '#E65100';
    let Icon = Clock;

    if (status === 'Approved') {
      bgColor = '#E8F5E9';
      textColor = theme.colors.success;
      Icon = CheckCircle;
    } else if (status === 'Rejected') {
      bgColor = theme.colors.destructive;
      textColor = theme.colors.destructiveText;
      Icon = AlertCircle;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Icon color={textColor} size={14} />
        <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Status</Text>
        <View style={{ width: 24 }} />
      </View>

      {leaves.length === 0 ? (
        <View style={styles.emptyState}>
          <HelpCircle color={theme.colors.border} size={64} />
          <Text style={styles.emptyStateTitle}>No Requests</Text>
          <Text style={styles.emptyStateText}>You haven't submitted any leave requests yet.</Text>
        </View>
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.leaveType}>{item.leave_type}</Text>
                {renderStatusBadge(item.status || 'Pending')}
              </View>

              <View style={styles.dateRow}>
                <Calendar color={theme.colors.textSecondary} size={16} />
                <Text style={styles.dateText}>
                  {item.start_date} to {item.end_date}
                </Text>
              </View>

              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{item.reason}</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leaveType: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  reasonContainer: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    marginTop: 5,
  },
  reasonLabel: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  reasonText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.textSecondary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
