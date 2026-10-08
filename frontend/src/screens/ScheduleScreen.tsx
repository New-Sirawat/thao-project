import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ArrowLeft, Clock, MapPin, Plus, Calendar as CalendarIcon, Trash2, Edit2 } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { theme } from '../theme';
import { AuthContext } from '../../App';
import { supabase } from '../lib/supabase';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'Meeting' | 'Workshop' | 'Focus';
  date?: string;
}

export default function ScheduleScreen() {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  // Removed unused role destructuring
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState('2026-06-24');

  React.useEffect(() => {
    if (isFocused) {
      fetchSchedules();
    }
  }, [isFocused]);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('training_plan_modules')
        .select('*')
        .order('dueDate', { ascending: true });
        
      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          time: '11:59 PM',
          location: 'Online Module',
          type: 'Workshop',
          date: item.dueDate ? item.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        setSchedules(formatted as ScheduleItem[]);
        
        if (formatted.length > 0) {
          setSelectedDate(formatted[0].date);
        }
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

  const activeSchedules = schedules;
  const filteredEvents = activeSchedules.filter(event => {
    const eventDate = event.date || '2026-06-24';
    return eventDate === selectedDate;
  });

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const markedDatesObj: any = {};
  activeSchedules.forEach(event => {
    const d = event.date || '2026-06-24';
    markedDatesObj[d] = { marked: true, dotColor: theme.colors.primary };
  });

  if (markedDatesObj[selectedDate]) {
    markedDatesObj[selectedDate].selected = true;
    markedDatesObj[selectedDate].selectedColor = theme.colors.primary;
  } else {
    markedDatesObj[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.colors.primary,
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.text,
          textMonthFontFamily: theme.typography.fontFamilyBold,
          textDayFontFamily: theme.typography.fontFamily,
          textDayHeaderFontFamily: theme.typography.fontFamilySemiBold,
        }}
        onDayPress={(day: any) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={markedDatesObj}
      />

      <View style={styles.upcomingHeader}>
        <Text style={styles.upcomingTitle}>Modules for {formattedDate}</Text>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No modules scheduled for this day</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <Text style={styles.timelineTime}>{item.time.split(' ')[0]}</Text>
              <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 5 }}>{item.time.split(' ')[1]}</Text>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...theme.shadows.medium,
  },
  backButton: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20
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
    top: 42,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 48,
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
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  calendar: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 20,
    paddingBottom: 10,
    paddingTop: 10,
    ...theme.shadows.subtle,
  },
  upcomingHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
  },
  upcomingTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
  }
});
