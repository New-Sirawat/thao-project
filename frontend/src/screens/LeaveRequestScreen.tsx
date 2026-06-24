import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Calendar as CalendarIcon, FileText, Send, X } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';

export default function LeaveRequestScreen() {
  const navigation = useNavigation();
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [isMultiDay, setIsMultiDay] = useState(false);
  
  // Format for react-native-calendars: YYYY-MM-DD
  const getToday = () => new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickingFor, setPickingFor] = useState<'start' | 'end'>('start');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDayPress = (day: any) => {
    if (pickingFor === 'start') {
      setStartDate(day.dateString);
      if (!isMultiDay) {
        setEndDate(day.dateString);
      } else if (day.dateString > endDate) {
        setEndDate(day.dateString);
      }
    } else {
      setEndDate(day.dateString);
    }
    setShowCalendar(false);
  };

  const leaveTypes = ['Sick Leave', 'Personal Leave', 'Vacation'];

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Missing Fields', 'Please provide a reason for your leave.');
      return;
    }

    const finalEndDate = isMultiDay ? endDate : startDate;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'You must be logged in.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          leave_type: leaveType,
          start_date: startDate,
          end_date: isMultiDay ? endDate : startDate,
          reason: reason,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Your leave request has been submitted successfully.', [
          { text: 'OK', onPress: () => navigation.navigate('LeaveStatus' as never) }
        ]);
      } else {
        const result = await response.json();
        Alert.alert('Submission Failed', result.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Could not connect to the server.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leave Type Selector */}
        <Text style={styles.sectionTitle}>Leave Type</Text>
        <View style={styles.typeContainer}>
          {leaveTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, leaveType === type && styles.typeButtonActive]}
              onPress={() => setLeaveType(type)}
            >
              <Text style={[styles.typeText, leaveType === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Inputs */}
        <Text style={styles.sectionTitle}>Duration</Text>
        
        {/* Toggle Duration */}
        <View style={styles.durationToggleContainer}>
          <TouchableOpacity 
            style={[styles.durationToggle, !isMultiDay && styles.durationToggleActive]} 
            onPress={() => {
              setIsMultiDay(false);
              setEndDate(startDate); // Sync dates
            }}
          >
            <Text style={[styles.durationToggleText, !isMultiDay && styles.durationToggleTextActive]}>1 Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.durationToggle, isMultiDay && styles.durationToggleActive]} 
            onPress={() => setIsMultiDay(true)}
          >
            <Text style={[styles.durationToggleText, isMultiDay && styles.durationToggleTextActive]}>Multiple Days</Text>
          </TouchableOpacity>
        </View>

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
          </TouchableOpacity>

          {isMultiDay && (
            <>
              <View style={{ width: 10, justifyContent: 'center', alignItems: 'center' }}>
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
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Custom Calendar Modal */}
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {pickingFor === 'start' ? 'Start Date' : 'End Date'}
                </Text>
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

        {/* Reason Input */}
        <Text style={styles.sectionTitle}>Reason for Leave</Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <View style={[styles.inputIconWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
            <FileText color={theme.colors.textSecondary} size={20} />
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Please provide a brief reason..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <>
              <Send color={theme.colors.surface} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Status Link */}
        <TouchableOpacity style={styles.statusLink} onPress={() => navigation.navigate('LeaveStatus' as never)}>
          <Text style={styles.statusLinkText}>View Request Status ➔</Text>
        </TouchableOpacity>

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
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  typeTextActive: {
    color: theme.colors.surface,
  },
  durationToggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  durationToggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md - 4,
  },
  durationToggleActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.subtle,
  },
  durationToggleText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  durationToggleTextActive: {
    color: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputContainerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  inputIconWrapper: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    height: 50,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.text,
  },
  textArea: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.text,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.medium,
  },
  submitButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.surface,
  },
  statusLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusLinkText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    width: '90%',
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
  },
});
