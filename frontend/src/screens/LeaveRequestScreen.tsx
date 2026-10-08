import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Send, X, Clock, Edit2, ChevronDown } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { theme } from '../theme';
import { AuthContext } from '../../App';
import { supabase } from '../lib/supabase';

export default function LeaveRequestScreen() {
  const navigation = useNavigation();
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [customLeaveType, setCustomLeaveType] = useState('');
  
  const getToday = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  
  const [durationType, setDurationType] = useState<'1_day' | 'multi_day' | 'half_day' | 'intra_day'>('1_day');
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');
  
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickingFor, setPickingFor] = useState<'start' | 'end'>('start');

  // Dropdown States
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pickingTimeFor, setPickingTimeFor] = useState<'start' | 'end'>('start');
  
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = React.useContext(AuthContext);

  const timeOptions = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleDayPress = (day: any) => {
    if (pickingFor === 'start') {
      setStartDate(day.dateString);
      if (durationType !== 'multi_day') {
        setEndDate(day.dateString);
      } else if (day.dateString > endDate) {
        setEndDate(day.dateString);
      }
    } else {
      setEndDate(day.dateString);
    }
    setShowCalendar(false);
  };

  const handleTimeSelect = (time: string) => {
    if (pickingTimeFor === 'start') {
      setStartTime(time);
      // Automatically adjust end time if it's earlier than start time
      if (time >= endTime) {
        const nextIndex = timeOptions.indexOf(time) + 1;
        if (nextIndex < timeOptions.length) {
          setEndTime(timeOptions[nextIndex]);
        }
      }
    } else {
      setEndTime(time);
    }
    setShowTimeModal(false);
  };

  const leaveTypes = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Other'];

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Missing Fields', 'Please provide a reason for your leave.');
      return;
    }

    if (leaveType === 'Other' && !customLeaveType) {
      if (Platform.OS === 'web') window.alert('Missing Fields: Please specify your other leave type.');
      else Alert.alert('Missing Fields', 'Please specify your other leave type.');
      return;
    }

    // --- Validation: Past Dates ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedStartDate = new Date(startDate);
    if (selectedStartDate < today) {
      if (Platform.OS === 'web') window.alert('Invalid Date: Cannot select a date in the past.');
      else Alert.alert('Invalid Date', 'Cannot select a date in the past.');
      return;
    }

    // --- Validation: End Date < Start Date ---
    if (durationType === 'multi_day') {
      if (new Date(endDate) < selectedStartDate) {
        if (Platform.OS === 'web') window.alert('Invalid Date: End date cannot be before start date.');
        else Alert.alert('Invalid Date', 'End date cannot be before start date.');
        return;
      }
    }

    // --- Validation: End Time <= Start Time ---
    if (durationType === 'intra_day') {
      if (endTime <= startTime) {
        if (Platform.OS === 'web') window.alert('Invalid Time: End time must be after start time.');
        else Alert.alert('Invalid Time', 'End time must be after start time.');
        return;
      }
    }

    let finalEndDate = startDate;
    let finalReason = reason;

    // Append custom type to reason since DB Enum is strictly 'OTHER'
    if (leaveType === 'Other') {
      finalReason = `[Type: ${customLeaveType}] ` + finalReason;
    }

    if (durationType === 'multi_day') {
      finalEndDate = endDate;
    } else if (durationType === 'half_day') {
      finalReason = finalReason + ` (Half Day: ${halfDayPeriod === 'morning' ? 'Morning' : 'Afternoon'})`;
    } else if (durationType === 'intra_day') {
      finalReason = finalReason + ` (Time: ${startTime} - ${endTime})`;
    }

    let dbType = 'OTHER';
    if (leaveType === 'Sick Leave') dbType = 'SICK';
    else if (leaveType === 'Casual Leave') dbType = 'CASUAL';
    else if (leaveType === 'Annual Leave') dbType = 'ANNUAL';

    setLoading(true);
    try {
      if (!session) {
        Alert.alert('Error', 'You must be logged in.');
        setLoading(false);
        return;
      }

      const newId = generateUUID();
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          id: newId,
          studentId: session.user.id,
          type: dbType,
          startDate: startDate,
          endDate: finalEndDate,
          reason: finalReason,
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (!error) {
        // Send notification to Mentor
        try {
          const { data: mentorData } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'MENTOR')
            .limit(1)
            .single();
            
          if (mentorData) {
            await supabase.from('notifications').insert({
              id: generateUUID(),
              userId: mentorData.id,
              title: 'New Leave Request',
              message: `A student has submitted a ${leaveType} request for ${startDate}.`,
              type: 'info',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        } catch (notifErr) {
          console.log('Failed to notify mentor', notifErr);
        }

        if (Platform.OS === 'web') {
          window.alert('Leave Request Submitted: Please wait for approval');
          navigation.navigate('LeaveStatus' as never);
        } else {
          Alert.alert('Leave Request Submitted', 'Please wait for approval', [
            { text: 'OK', onPress: () => navigation.navigate('LeaveStatus' as never) }
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('Submission Failed: ' + (error.message || 'Something went wrong.'));
        } else {
          Alert.alert('Submission Failed', error.message || 'Something went wrong.');
        }
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert('Network Error: Could not connect to the server.');
      } else {
        Alert.alert('Network Error', 'Could not connect to the server.');
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Request</Text>
        <TouchableOpacity style={styles.myRequestsBtn} onPress={() => navigation.navigate('LeaveStatus' as never)}>
          <Clock color={theme.colors.surface} size={20} />
          <Text style={styles.myRequestsText}>My Requests</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Duration Type</Text>
        <View style={styles.durationToggleContainer}>
          <TouchableOpacity 
            style={[styles.durationToggle, durationType === '1_day' && styles.durationToggleActive]} 
            onPress={() => { setDurationType('1_day'); setEndDate(startDate); }}
          >
            <Text style={[styles.durationToggleText, durationType === '1_day' && styles.durationToggleTextActive]}>1 Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.durationToggle, durationType === 'multi_day' && styles.durationToggleActive]} 
            onPress={() => setDurationType('multi_day')}
          >
            <Text style={[styles.durationToggleText, durationType === 'multi_day' && styles.durationToggleTextActive]}>Multi-day</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.durationToggleContainer, { marginTop: 10 }]}>
          <TouchableOpacity 
            style={[styles.durationToggle, durationType === 'half_day' && styles.durationToggleActive]} 
            onPress={() => { setDurationType('half_day'); setEndDate(startDate); }}
          >
            <Text style={[styles.durationToggleText, durationType === 'half_day' && styles.durationToggleTextActive]}>Half Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.durationToggle, durationType === 'intra_day' && styles.durationToggleActive]} 
            onPress={() => { setDurationType('intra_day'); setEndDate(startDate); }}
          >
            <Text style={[styles.durationToggleText, durationType === 'intra_day' && styles.durationToggleTextActive]}>During the Day</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Date & Time</Text>
        
        {/* Date Row */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.inputContainerRow} 
            onPress={() => {
              setPickingFor('start');
              setShowCalendar(true);
            }}
          >
            <View style={styles.inputIconWrapper}>
              <CalendarIcon color={theme.colors.textSecondary} size={20} />
            </View>
            <Text style={[styles.inputField, { lineHeight: 50 }]}>{startDate}</Text>
            <ChevronDown color={theme.colors.border} size={20} style={{ marginRight: 15 }} />
          </TouchableOpacity>

          {durationType === 'multi_day' && (
            <>
              <View style={{ width: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: theme.colors.textSecondary }}>-</Text>
              </View>
              <TouchableOpacity 
                style={styles.inputContainerRow} 
                onPress={() => {
                  setPickingFor('end');
                  setShowCalendar(true);
                }}
              >
                <View style={styles.inputIconWrapper}>
                  <CalendarIcon color={theme.colors.textSecondary} size={20} />
                </View>
                <Text style={[styles.inputField, { lineHeight: 50 }]}>{endDate}</Text>
                <ChevronDown color={theme.colors.border} size={20} style={{ marginRight: 15 }} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Intra-day Time Row */}
        {durationType === 'intra_day' && (
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.inputContainerRow}
              onPress={() => {
                setPickingTimeFor('start');
                setShowTimeModal(true);
              }}
            >
              <View style={styles.inputIconWrapper}>
                <Clock color={theme.colors.textSecondary} size={20} />
              </View>
              <Text style={[styles.inputField, { lineHeight: 50 }]}>{startTime}</Text>
              <ChevronDown color={theme.colors.border} size={20} style={{ marginRight: 15 }} />
            </TouchableOpacity>

            <View style={{ width: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: theme.colors.textSecondary }}>-</Text>
            </View>

            <TouchableOpacity 
              style={styles.inputContainerRow}
              onPress={() => {
                setPickingTimeFor('end');
                setShowTimeModal(true);
              }}
            >
              <View style={styles.inputIconWrapper}>
                <Clock color={theme.colors.textSecondary} size={20} />
              </View>
              <Text style={[styles.inputField, { lineHeight: 50 }]}>{endTime}</Text>
              <ChevronDown color={theme.colors.border} size={20} style={{ marginRight: 15 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker Modal */}
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {pickingFor === 'start' ? 'Start Date' : 'End Date'}</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <X color={theme.colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              <Calendar
                current={pickingFor === 'start' ? startDate : endDate}
                minDate={pickingFor === 'end' ? startDate : undefined}
                onDayPress={handleDayPress}
                theme={{
                  selectedDayBackgroundColor: theme.colors.primary,
                  todayTextColor: theme.colors.primary,
                  arrowColor: theme.colors.primary,
                }}
                markedDates={{
                  [pickingFor === 'start' ? startDate : endDate]: { selected: true, selectedColor: theme.colors.primary }
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Leave Type Modal */}
        <Modal
          visible={showLeaveTypeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLeaveTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Leave Type</Text>
                <TouchableOpacity onPress={() => setShowLeaveTypeModal(false)}>
                  <X color={theme.colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              <View style={{ paddingVertical: 10 }}>
                {leaveTypes.map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    style={[
                      styles.timeOptionItem, 
                      leaveType === type && styles.timeOptionItemActive
                    ]}
                    onPress={() => {
                      setLeaveType(type);
                      setShowLeaveTypeModal(false);
                    }}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      leaveType === type && styles.timeOptionTextActive
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {pickingTimeFor === 'start' ? 'Start Time' : 'End Time'}</Text>
                <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                  <X color={theme.colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {timeOptions.map((time) => (
                  <TouchableOpacity 
                    key={time} 
                    style={[
                      styles.timeOptionItem, 
                      ((pickingTimeFor === 'start' && startTime === time) || (pickingTimeFor === 'end' && endTime === time)) && styles.timeOptionItemActive
                    ]}
                    onPress={() => handleTimeSelect(time)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      ((pickingTimeFor === 'start' && startTime === time) || (pickingTimeFor === 'end' && endTime === time)) && styles.timeOptionTextActive
                    ]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Half-day Period Row */}
        {durationType === 'half_day' && (
          <View style={styles.durationToggleContainer}>
            <TouchableOpacity 
              style={[styles.durationToggle, halfDayPeriod === 'morning' && styles.durationToggleActive]} 
              onPress={() => setHalfDayPeriod('morning')}
            >
              <Text style={[styles.durationToggleText, halfDayPeriod === 'morning' && styles.durationToggleTextActive]}>Morning (08:00 - 12:00)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.durationToggle, halfDayPeriod === 'afternoon' && styles.durationToggleActive]} 
              onPress={() => setHalfDayPeriod('afternoon')}
            >
              <Text style={[styles.durationToggleText, halfDayPeriod === 'afternoon' && styles.durationToggleTextActive]}>Afternoon (13:30 - 15:30)</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Leave Type</Text>
        <TouchableOpacity 
          style={styles.inputContainerRow}
          onPress={() => setShowLeaveTypeModal(true)}
        >
          <View style={styles.inputIconWrapper}>
            <FileText color={theme.colors.textSecondary} size={20} />
          </View>
          <Text style={[styles.inputField, { lineHeight: 50, color: leaveType ? theme.colors.text : theme.colors.textSecondary }]}>
            {leaveType}
          </Text>
          <ChevronDown color={theme.colors.border} size={20} style={{ marginRight: 15 }} />
        </TouchableOpacity>

        {leaveType === 'Other' && (
          <View style={styles.inputContainer}>
            <View style={styles.inputIconWrapper}>
              <Edit2 color={theme.colors.textSecondary} size={20} />
            </View>
            <TextInput
              style={styles.inputField}
              placeholder="Specify Leave Type (e.g. Funeral)"
              value={customLeaveType}
              onChangeText={setCustomLeaveType}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Reason</Text>
        <View style={styles.inputContainer}>
          <View style={[styles.inputIconWrapper, { top: 15 }]}>
            <FileText color={theme.colors.textSecondary} size={20} />
          </View>
          <TextInput
            style={[styles.inputField, styles.textArea]}
            placeholder="Please provide details for your leave..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <>
              <Send color={theme.colors.surface} size={20} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...theme.shadows.medium,
  },
  backButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  headerTitle: { fontFamily: theme.typography.fontFamilyBold, fontSize: 18, color: theme.colors.surface },
  myRequestsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  myRequestsText: { color: theme.colors.surface, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 12, marginLeft: 4 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 15, marginTop: 10 },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  typeButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  typeText: { fontFamily: theme.typography.fontFamilySemiBold, fontSize: 14, color: theme.colors.textSecondary },
  typeTextActive: { color: theme.colors.surface },
  
  durationToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationToggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  durationToggleActive: {
    backgroundColor: theme.colors.primary + '15',
  },
  durationToggleText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  durationToggleTextActive: {
    color: theme.colors.primary,
  },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputContainerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 50,
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconWrapper: { position: 'absolute', left: 15, zIndex: 1 },
  inputField: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.colors.text,
    paddingLeft: 45,
    paddingRight: 15,
    height: 50,
  },
  textArea: { paddingVertical: 15, height: 120 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.md,
    gap: 10,
  },
  submitButtonText: { fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.surface },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontFamily: theme.typography.fontFamilyBold, fontSize: 18, color: theme.colors.text },
  timeOptionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border, alignItems: 'center' },
  timeOptionItemActive: { backgroundColor: theme.colors.primary + '15' },
  timeOptionText: { fontFamily: theme.typography.fontFamily, fontSize: 16, color: theme.colors.text },
  timeOptionTextActive: { fontFamily: theme.typography.fontFamilyBold, color: theme.colors.primary },
});
