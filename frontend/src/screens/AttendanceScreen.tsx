import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { ArrowLeft, CheckCircle, XCircle, FileText, Calendar, Clock, Edit2, Trash2, Users } from 'lucide-react-native';
import { AuthContext } from '../../App';
import { supabase } from '../lib/supabase';

export default function AttendanceScreen() {
  const navigation = useNavigation();
  const { session } = React.useContext(AuthContext);

  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [stats, setStats] = React.useState({
    totalDays: 0,
    onTime: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchAttendance();
    }, [session])
  );

  const fetchAttendance = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('userId', session.user.id)
        .order('date', { ascending: false });

      if (data) {
        const formattedHistory = data.map(item => {
          const checkInStr = item.checkIn ? (item.checkIn.endsWith('Z') ? item.checkIn : item.checkIn + 'Z') : null;
          const inTime = checkInStr ? new Date(checkInStr) : null;
          const outTime = item.checkOut ? new Date(item.checkOut.endsWith('Z') ? item.checkOut : item.checkOut + 'Z') : null;
          
          let status = 'On Time';
          if (item.status === 'LATE') status = 'Late';
          else if (item.status === 'ABSENT') status = 'Absent';
          else if (item.status === 'ON_LEAVE') status = 'On Leave';
          else if (item.status === 'PRESENT' && inTime) {
            if (inTime.getHours() > 8 || (inTime.getHours() === 8 && inTime.getMinutes() > 15)) {
               status = 'Late';
            }
          } else if (!item.status && inTime) {
            if (inTime.getHours() > 8 || (inTime.getHours() === 8 && inTime.getMinutes() > 15)) {
               status = 'Late';
            }
          } else if (!inTime) {
            status = 'Absent';
          }
          
          let calculatedTotalHours = null;
          if (inTime && outTime) {
            const diffMs = outTime.getTime() - inTime.getTime();
            if (diffMs > 0) {
              const hours = Math.floor(diffMs / 3600000);
              const mins = Math.floor((diffMs % 3600000) / 60000);
              const secs = Math.floor((diffMs % 60000) / 1000);
              calculatedTotalHours = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
          }
          
          return {
            id: item.id,
            date: inTime ? inTime.toLocaleDateString() : (item.date || 'Unknown'),
            checkIn: inTime ? inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            checkOut: outTime ? outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (inTime ? 'Working...' : '-'),
            status: status,
            totalHours: calculatedTotalHours
          };
        });
        setHistory(formattedHistory);
        
        let onTimeCount = formattedHistory.filter(h => h.status === 'On Time').length;
        let lateCount = formattedHistory.filter(h => h.status === 'Late').length;
        let absentCount = formattedHistory.filter(h => h.status === 'Absent').length;
        let onLeaveCount = formattedHistory.filter(h => h.status === 'On Leave').length;
        
        setStats({
          totalDays: data.length,
          onTime: onTimeCount,
          late: lateCount,
          absent: absentCount,
          onLeave: onLeaveCount
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = stats.totalDays > 0 ? Math.round((stats.onTime / stats.totalDays) * 100) : 0;



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time': return '#10B981'; // Green
      case 'Late': return '#F59E0B'; // Amber
      case 'Absent': return '#EF4444'; // Red
      case 'On Leave': return '#3B82F6'; // Blue
      default: return theme.colors.textSecondary;
    }
  };

  const renderStudentView = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance Rate</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{attendanceRate}%</Text>
          <Text style={styles.progressSubText}>Excellent</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${attendanceRate}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.onTime}</Text>
          <Text style={styles.statLabel}>On Time</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent History</Text>
      <View style={styles.historyList}>
        {loading ? (
           <ActivityIndicator size="small" color={theme.colors.primary} style={{ padding: 20 }} />
        ) : history.length === 0 ? (
           <Text style={{ padding: 20, textAlign: 'center', color: theme.colors.textSecondary }}>No attendance history</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                  <Clock size={20} color={getStatusColor(item.status)} />
                </View>
                <View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyTime}>{item.checkIn} - {item.checkOut}</Text>
                  {item.totalHours && (
                    <Text style={{ fontSize: 11, color: theme.colors.primary, marginTop: 2, fontFamily: theme.typography.fontFamilySemiBold }}>
                      Total: {item.totalHours}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderStudentView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  backButton: { padding: 5 },
  headerTitle: { fontFamily: theme.typography.fontFamilyBold, fontSize: 20, color: theme.colors.surface },
  content: { padding: 20 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20, marginBottom: 20, ...theme.shadows.subtle },
  cardTitle: { fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 15 },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  progressText: { fontFamily: theme.typography.fontFamilyBold, fontSize: 36, color: theme.colors.primary, marginRight: 10 },
  progressSubText: { fontFamily: theme.typography.fontFamilySemiBold, fontSize: 16, color: theme.colors.success },
  progressBarBackground: { height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  sectionTitle: { fontFamily: theme.typography.fontFamilyBold, fontSize: 18, color: theme.colors.text, marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: 15, alignItems: 'center', marginBottom: 15, ...theme.shadows.subtle },
  statValue: { fontFamily: theme.typography.fontFamilyBold, fontSize: 28, marginBottom: 5 },
  statLabel: { fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.textSecondary },
  historyList: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, ...theme.shadows.subtle },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  historyDate: { fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 4 },
  historyTime: { fontFamily: theme.typography.fontFamily, fontSize: 13, color: theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: theme.typography.fontFamilySemiBold, fontSize: 12 },
  

});
