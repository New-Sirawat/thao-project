import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { Bell, Clock, Calendar, ChevronRight, FileText, Users, Upload, AlertCircle, CheckCircle } from 'lucide-react-native';
import { AuthContext } from '../../App';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { role } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeStr, setTimeStr] = useState<string>('');
  const [hasLeaveHistory, setHasLeaveHistory] = useState<boolean>(false);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState({ total: 0, checkedIn: 0, absent: 0 });

  useEffect(() => {
    // Check if user has leave history or mentor pending leaves
    const fetchDashboardData = async () => {
      try {
        if (role === 'Student') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await fetch(`http://192.168.2.28:3000/api/leaves?user_id=${session.user.id}`);
            const result = await response.json();
            if (response.ok && result.data && result.data.length > 0) {
              setHasLeaveHistory(true);
            }
          }
        } else if (role === 'Mentor') {
          // Fetch all leaves to count pending ones
          const response = await fetch('http://192.168.2.28:3000/api/leaves');
          const result = await response.json();
          if (response.ok && result.data) {
            const pending = result.data.filter((r: any) => r.status === 'Pending');
            setPendingLeavesCount(pending.length);
          }
        }

        // Fetch schedules
        const schedRes = await fetch('http://192.168.2.28:3000/api/schedules');
        const schedData = await schedRes.json();
        if (schedRes.ok && schedData.data) {
          setSchedules(schedData.data);
        }

        // Fetch alerts
        const alertRes = await fetch('http://192.168.2.28:3000/api/alerts');
        const alertData = await alertRes.json();
        if (alertRes.ok && alertData.data) {
          setAlerts(alertData.data);
        }

        if (role === 'Mentor') {
          // Fetch student stats
          const studentRes = await fetch('http://192.168.2.28:3000/api/students');
          const studentData = await studentRes.json();
          if (studentRes.ok && studentData.stats) {
            setStudentStats(studentData.stats);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();

    // Update clock every minute
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [role]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderStudentDashboard = () => (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current Time & Status</Text>
        </View>
        <View style={styles.timeRow}>
          <Clock color={theme.colors.primary} size={32} />
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>Checked In</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Attendance' as never)}>
          <View style={styles.actionIcon}>
            <Clock color={theme.colors.primary} size={24} />
          </View>
          <Text style={styles.actionText}>Attendance</Text>
        </TouchableOpacity>
        {hasLeaveHistory && (
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('LeaveStatus' as never)}>
            <View style={styles.actionIcon}>
              <FileText color={theme.colors.primary} size={24} />
            </View>
            <Text style={styles.actionText}>Leave Status</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Announcements</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Announcements' as never)}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.announcementItem} onPress={() => navigation.navigate('Announcements' as never)}>
          <View style={styles.announcementDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.announcementTitle}>Weekly Sync Meeting</Text>
            <Text style={styles.announcementTime}>Today, 2:00 PM</Text>
          </View>
          <ChevronRight color={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.announcementItem} onPress={() => navigation.navigate('Announcements' as never)}>
          <View style={[styles.announcementDot, { backgroundColor: theme.colors.success }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.announcementTitle}>Submit Weekly Report</Text>
            <Text style={styles.announcementTime}>Tomorrow, 5:00 PM</Text>
          </View>
          <ChevronRight color={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Today's Schedule</Text>
      {schedules.slice(0, 2).map((sched: any, index: number) => (
        <TouchableOpacity key={sched.id || index} style={styles.scheduleCard} onPress={() => navigation.navigate('Schedule' as never)}>
          <View style={styles.scheduleIconWrapper}>
            <Calendar color={theme.colors.primary} size={20} />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTitle}>{sched.title}</Text>
            <Text style={styles.scheduleTime}>{sched.time}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderMentorDashboard = () => (
    <>
      <Text style={styles.sectionTitle}>Overview Statistics</Text>
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('MentorStudents' as never)}>
          <Users color={theme.colors.primary} size={28} />
          <Text style={styles.statValue}>{studentStats.total}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('LeaveApprovals' as never)}>
          <AlertCircle color={pendingLeavesCount > 0 ? theme.colors.warning : theme.colors.success} size={28} />
          <Text style={[styles.statValue, pendingLeavesCount > 0 && { color: theme.colors.warning }]}>{pendingLeavesCount}</Text>
          <Text style={styles.statLabel}>Pending Leaves</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('MentorStudents' as never)}>
          <CheckCircle color={theme.colors.success} size={28} />
          <Text style={styles.statValue}>{studentStats.checkedIn}/{studentStats.total}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Mentor Actions</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('LeaveApprovals' as never)}>
          <View style={styles.actionIcon}>
            <FileText color={theme.colors.primary} size={24} />
          </View>
          <Text style={styles.actionText}>Approve Leaves</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Training' as never)}>
          <View style={styles.actionIcon}>
            <Upload color={theme.colors.primary} size={24} />
          </View>
          <Text style={styles.actionText}>Upload Plan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Activity Alerts</Text>
        </View>
        {pendingLeavesCount > 0 && (
          <TouchableOpacity style={styles.announcementItem} onPress={() => navigation.navigate('LeaveApprovals' as never)}>
            <View style={[styles.announcementDot, { backgroundColor: theme.colors.warning }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.announcementTitle}>{pendingLeavesCount} Students requested leave</Text>
              <Text style={styles.announcementTime}>Requires your approval</Text>
            </View>
            <ChevronRight color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>
        )}
        <View style={styles.divider} />
        {alerts.slice(0, 2).map((alert: any, index: number) => (
          <View key={alert.id || index}>
            <TouchableOpacity style={styles.announcementItem} onPress={() => navigation.navigate('Schedule' as never)}>
              <View style={[styles.announcementDot, { backgroundColor: alert.type === 'info' ? theme.colors.primary : theme.colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.announcementTitle}>{alert.title}</Text>
                <Text style={styles.announcementTime}>{alert.time}</Text>
              </View>
              <ChevronRight color={theme.colors.textSecondary} size={20} />
            </TouchableOpacity>
            {index < alerts.slice(0, 2).length - 1 && <View style={styles.divider} />}
          </View>
        ))}
        {alerts.length === 0 && (
          <TouchableOpacity style={styles.announcementItem} onPress={() => navigation.navigate('MentorStudents' as never)}>
            <View style={[styles.announcementDot, { backgroundColor: theme.colors.destructiveText }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.announcementTitle}>4 Students haven't checked in</Text>
              <Text style={styles.announcementTime}>Today, 9:30 AM</Text>
            </View>
            <ChevronRight color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Mentoring Schedule</Text>
      {schedules.slice(0, 2).map((sched: any, index: number) => (
        <TouchableOpacity key={sched.id || index} style={styles.scheduleCard} onPress={() => navigation.navigate('Schedule' as never)}>
          <View style={styles.scheduleIconWrapper}>
            <Users color={theme.colors.primary} size={20} />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTitle}>{sched.title}</Text>
            <Text style={styles.scheduleTime}>{sched.time}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Hi, {role === 'Mentor' ? 'Mentor' : 'Nguyen Van A'}</Text>
          <Text style={styles.subGreetingText}>{role === 'Mentor' ? 'Software Engineering Mentor' : 'Frontend Developer Intern'}</Text>
        </View>
        <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notifications' as never)}>
          <Bell color={theme.colors.surface} size={24} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {role === 'Student' ? renderStudentDashboard() : renderMentorDashboard()}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...theme.shadows.medium,
  },
  greetingText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 24,
    color: theme.colors.surface,
  },
  subGreetingText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  bellButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: theme.colors.destructiveText,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  seeAllText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 32,
    color: theme.colors.text,
    marginLeft: 12,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  statusBadgeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.success,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: -5,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: 5,
    ...theme.shadows.subtle,
  },
  statValue: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 22,
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: -5,
  },
  actionButton: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: 5,
    ...theme.shadows.subtle,
  },
  actionIcon: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
  },
  actionText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  announcementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: 12,
  },
  announcementTitle: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 4,
  },
  announcementTime: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 5,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 15,
  },
  scheduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.subtle,
  },
  scheduleIconWrapper: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  scheduleTime: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
