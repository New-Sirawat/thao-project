import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react-native';
import { theme } from '../theme';
import { AuthContext } from '../../App';
import { supabase } from '../lib/supabase';

interface LeaveRecord {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  rejectionReason?: string;
}

export default function LeaveStatusScreen() {
  const navigation = useNavigation();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'History'>('All');
  const [loading, setLoading] = useState(true);
  const { session } = React.useContext(AuthContext);

  useEffect(() => {
    fetchLeaves();
    
    if (session?.user?.id) {
      const channel = supabase
        .channel('leave-status-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leave_requests', filter: `studentId=eq.${session.user.id}` },
          () => {
            fetchLeaves();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchLeaves = async () => {
    try {
      if (!session) return;

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('studentId', session.user.id)
        .order('startDate', { ascending: false });

      if (error) {
        console.error('Error fetching leaves:', error);
      } else if (data) {
        // Map data to match the UI interface if necessary
        const mappedData = data.map(item => ({
          id: item.id,
          leave_type: item.type,
          start_date: item.startDate,
          end_date: item.endDate,
          reason: item.reason,
          status: item.status,
          rejectionReason: item.approverNote
        }));
        setLeaves(mappedData);
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

    if (status.toUpperCase() === 'APPROVED') {
      bgColor = '#E8F5E9';
      textColor = theme.colors.success;
      Icon = CheckCircle;
    } else if (status.toUpperCase() === 'REJECTED') {
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

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'All' && styles.filterBtnActive]}
          onPress={() => setFilter('All')}
        >
          <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'Pending' && styles.filterBtnActive]}
          onPress={() => setFilter('Pending')}
        >
          <Text style={[styles.filterText, filter === 'Pending' && styles.filterTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'History' && styles.filterBtnActive]}
          onPress={() => setFilter('History')}
        >
          <Text style={[styles.filterText, filter === 'History' && styles.filterTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {(() => {
        const filteredLeaves = leaves.filter(item => {
          if (filter === 'All') return true;
          if (filter === 'Pending') return item.status === 'PENDING';
          if (filter === 'History') return item.status !== 'PENDING';
          return true;
        });

        if (filteredLeaves.length === 0) {
          return (
            <View style={styles.emptyState}>
              <HelpCircle color={theme.colors.border} size={64} />
              <Text style={styles.emptyStateTitle}>No Requests</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'All' ? "You haven't submitted any leave requests yet." : `No ${filter.toLowerCase()} requests found.`}
              </Text>
            </View>
          );
        }

        return (
          <FlatList
            data={filteredLeaves}
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
              
              {item.status === 'REJECTED' && item.rejectionReason && (
                <View style={[styles.reasonContainer, { backgroundColor: '#FEE2E2', marginTop: 10 }]}>
                  <Text style={[styles.reasonLabel, { color: '#B91C1C' }]}>Rejection Reason:</Text>
                  <Text style={[styles.reasonText, { color: '#B91C1C' }]}>{item.rejectionReason}</Text>
                </View>
              )}
            </View>
          )}
        />
        );
      })()}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: theme.colors.background,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
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
