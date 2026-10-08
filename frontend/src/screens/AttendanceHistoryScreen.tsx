import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { theme } from '../theme';
import { AuthContext } from '../../App';
import { API_BASE_URL } from '../lib/api';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
}

export default function AttendanceHistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = React.useContext(AuthContext);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      if (!session) return;

      const response = await fetch(`${API_BASE_URL}/api/attendance/history?user_id=${session.user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();

      if (response.ok && result.data) {
        // Sort by date descending
        const sortedData = result.data.sort((a: AttendanceRecord, b: AttendanceRecord) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setHistory(sortedData);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    let bgColor = '#E8F5E9';
    let textColor = theme.colors.success;
    let Icon = CheckCircle;

    if (status === 'Completed') {
      bgColor = '#E3F2FD';
      textColor = '#1976D2';
    } else if (status === 'Auto-Checkout') {
      bgColor = '#FFF3E0';
      textColor = '#E65100';
      Icon = AlertCircle;
    } else if (status === 'Absent') {
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

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: 24 }} />
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar color={theme.colors.border} size={64} />
          <Text style={styles.emptyStateTitle}>No Records Yet</Text>
          <Text style={styles.emptyStateText}>Your attendance history will appear here once you start checking in.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.dateRow}>
                  <Calendar color={theme.colors.primary} size={18} />
                  <Text style={styles.dateText}>
                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {renderStatusBadge(item.status)}
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Check-In</Text>
                  <View style={styles.timeValueRow}>
                    <Clock color={theme.colors.textSecondary} size={16} />
                    <Text style={styles.timeValue}>{formatTime(item.check_in_time)}</Text>
                  </View>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Check-Out</Text>
                  <View style={styles.timeValueRow}>
                    <Clock color={theme.colors.textSecondary} size={16} />
                    <Text style={styles.timeValue}>{formatTime(item.check_out_time)}</Text>
                  </View>
                </View>
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
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
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
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginLeft: 6,
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: 15,
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
