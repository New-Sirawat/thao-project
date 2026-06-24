import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ArrowLeft, Clock, MapPin, Calendar as CalendarIcon, Plus } from 'lucide-react-native';
import { theme } from '../theme';
import { AuthContext } from '../../App';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'Meeting' | 'Workshop' | 'Focus';
}

const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    title: 'Daily Standup',
    time: '09:00 AM - 09:30 AM',
    location: 'Meeting Room 1 / Meet',
    type: 'Meeting',
  },
  {
    id: '2',
    title: 'React Native Workshop',
    time: '10:00 AM - 11:30 AM',
    location: 'Training Room A',
    type: 'Workshop',
  },
  {
    id: '3',
    title: 'Lunch Break',
    time: '12:00 PM - 01:00 PM',
    location: 'Cafeteria',
    type: 'Focus',
  },
  {
    id: '4',
    title: 'Project Demo Prep',
    time: '03:00 PM - 04:00 PM',
    location: 'Desk',
    type: 'Focus',
  },
  {
    id: '5',
    title: '1:1 Sync with Mentor',
    time: '04:30 PM - 05:00 PM',
    location: 'Meeting Room 2',
    type: 'Meeting',
  }
];

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { role } = React.useContext(AuthContext);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isFocused) {
      fetchSchedules();
    }
  }, [isFocused]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('http://192.168.2.28:3000/api/schedules');
      const result = await response.json();
      if (response.ok && result.data) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Meeting': return theme.colors.primary;
      case 'Workshop': return theme.colors.success;
      case 'Focus': return theme.colors.textSecondary;
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.calendarHeader}>
        <CalendarIcon color={theme.colors.primary} size={24} />
        <Text style={styles.dateText}>Today, 24 June 2026</Text>
      </View>

      <FlatList
        data={schedules.length > 0 ? schedules : mockSchedule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <Text style={styles.timelineTime}>{item.time.split(' - ')[0]}</Text>
              <View style={[styles.timelineLine, { backgroundColor: getTypeColor(item.type) }]} />
              <View style={[styles.timelineDot, { borderColor: getTypeColor(item.type) }]} />
            </View>
            
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Clock color={theme.colors.textSecondary} size={14} />
                <Text style={styles.detailText}>{item.time}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MapPin color={theme.colors.textSecondary} size={14} />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      {role === 'Mentor' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('CreateSchedule' as never)}
        >
          <Plus color={theme.colors.surface} size={24} />
        </TouchableOpacity>
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dateText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 10,
  },
  listContainer: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 70,
    alignItems: 'center',
    marginRight: 15,
  },
  timelineTime: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 5,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    top: 25,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 30,
    bottom: -30,
    zIndex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 15,
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
  title: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
});
