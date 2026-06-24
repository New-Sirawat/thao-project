import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import { theme } from '../theme';

export default function CreateScheduleScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('meeting');
  const [loading, setLoading] = useState(false);

  const handleCreateSchedule = async () => {
    if (!title || !time || !location) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://192.168.2.28:3000/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          time,
          location,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed on the server');
      }

      Alert.alert(
        'Success!',
        `Schedule "${title}" has been created. An alert has been sent to the intern(s).`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create the schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meeting Title</Text>
            <View style={styles.inputWrapper}>
              <Users color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 1:1 Sync with Intern A"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.inputWrapper}>
              <Clock color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 10:00 AM - 11:30 AM"
                placeholderTextColor={theme.colors.textSecondary}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location / Platform</Text>
            <View style={styles.inputWrapper}>
              <MapPin color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Google Meet, Room 302"
                placeholderTextColor={theme.colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <Text style={styles.label}>Meeting Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'meeting' && styles.typeButtonActive]}
              onPress={() => setType('meeting')}
            >
              <Text style={[styles.typeButtonText, type === 'meeting' && styles.typeButtonTextActive]}>1:1 Meeting</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'workshop' && styles.typeButtonActive]}
              onPress={() => setType('workshop')}
            >
              <Text style={[styles.typeButtonText, type === 'workshop' && styles.typeButtonTextActive]}>Workshop</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.submitButton} onPress={handleCreateSchedule} disabled={loading}>
          <CheckCircle color={theme.colors.surface} size={20} />
          <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Schedule'}</Text>
        </TouchableOpacity>
      </View>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  typeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
  },
  typeButtonText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
    color: theme.colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  submitButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
  },
  submitButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.surface,
    marginLeft: 10,
  },
});
