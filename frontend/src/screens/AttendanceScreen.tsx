import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { theme } from '../theme';
import { MapPin, Clock, FileText } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../../App';

export default function AttendanceScreen() {
  const navigation = useNavigation();
  const { role } = useContext(AuthContext);
  const [timeStr, setTimeStr] = useState('');
  const [locationStatus, setLocationStatus] = useState('Checking GPS...');
  const [locationColor, setLocationColor] = useState(theme.colors.warning);
  const [loading, setLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState('0h 0m');
  const [checkInResult, setCheckInResult] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    // Update digital clock
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Check GPS Permissions
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('GPS Permission Denied');
        setLocationColor(theme.colors.destructiveText);
        return;
      }
      setLocationStatus('GPS Connection: Good');
      setLocationColor(theme.colors.success);
    })();

    // Check if already checked in today
    const checkTodayStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const response = await fetch(`http://192.168.2.28:3000/api/attendance/today?user_id=${session.user.id}`);
        const result = await response.json();
        
        if (response.ok && result.data) {
          if (result.data.status === 'Checked In') {
            setIsCheckedIn(true);
            setWorkingHours('...'); // Can be calculated from check_in_time
          } else if (result.data.status === 'Completed') {
            setIsCheckedIn(false);
            setCheckInResult({ type: 'success', text: 'You have already completed your shift today.' });
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    checkTodayStatus();

    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    setCheckInResult(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCheckInResult({ type: 'error', text: 'You must be logged in.' });
      setLoading(false);
      return;
    }

    if (isCheckedIn) {
      // Check-out API
      try {
        const response = await fetch('http://192.168.2.28:3000/api/attendance/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: session.user.id }),
        });
        if (response.ok) {
          setIsCheckedIn(false);
          setCheckInResult({ type: 'success', text: 'Check-out successful! Good job today.' });
        } else {
          setCheckInResult({ type: 'error', text: 'Failed to check out.' });
        }
      } catch (error) {
        setCheckInResult({ type: 'error', text: 'Network Error.' });
      }
      setLoading(false);
      return;
    }
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCheckInResult({ type: 'error', text: 'GPS Permission Denied. Please enable location services.' });
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});

      // NOTE: If testing on Android Emulator, change localhost to 10.0.2.2
      // If testing on a physical device, change to your PC's local IP address (e.g., 192.168.1.x)
      const response = await fetch('http://192.168.2.28:3000/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setCheckInResult({ type: 'success', text: 'Check-in successful! Have a great day.' });
        setWorkingHours('0h 1m'); 
        setIsCheckedIn(true);
      } else {
        setCheckInResult({ type: 'error', text: `Check-In Failed: ${result.error}\n(Distance: ${Math.round(result.distance || 0)}m)\nYour GPS: ${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` });
      }
    } catch (error: any) {
      console.error(error);
      setCheckInResult({ type: 'error', text: 'Network Error: Could not connect to the server (Check localhost/IP). Details: ' + error.message });
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.dateText}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.digitalClock}>{timeStr}</Text>
          
          <View style={styles.gpsContainer}>
            <MapPin color={locationColor} size={16} />
            <Text style={[styles.gpsText, { color: locationColor }]}>
              {locationStatus}
            </Text>
          </View>
        </View>

        {/* Big Orange Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity 
            style={[styles.checkInButton, isCheckedIn && styles.checkOutButton]} 
            onPress={handleCheckIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} size="large" />
            ) : (
              <View style={styles.buttonContent}>
                <MapPin color={theme.colors.surface} size={28} />
                <Text style={styles.checkInText}>
                  {isCheckedIn ? 'Check Out' : 'Check-In Now'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {checkInResult && (
            <View style={[styles.resultBox, checkInResult.type === 'success' ? styles.resultSuccess : styles.resultError]}>
              <Text style={[styles.resultText, checkInResult.type === 'success' ? styles.resultSuccessText : styles.resultErrorText]}>
                {checkInResult.text}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Clock color={theme.colors.primary} size={20} />
            <Text style={styles.statLabel}>Working Hours</Text>
            <Text style={styles.statValue}>{workingHours}</Text>
          </View>
        </View>

        {/* Link */}
        <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('AttendanceHistory' as never)}>
          <Text style={styles.historyText}>View Attendance History ➔</Text>
        </TouchableOpacity>

        {/* Leave Actions */}
        <View style={styles.leaveActionsContainer}>
          <TouchableOpacity style={styles.leaveButton} onPress={() => navigation.navigate('LeaveRequest' as never)}>
            <FileText color={theme.colors.primary} size={24} />
            <Text style={styles.leaveButtonText}>Request Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={() => navigation.navigate('LeaveStatus' as never)}>
            <Clock color={theme.colors.primary} size={24} />
            <Text style={styles.leaveButtonText}>Leave Status</Text>
          </TouchableOpacity>
        </View>

        {/* Mentor Action: Leave Approvals */}
        {role === 'Mentor' && (
          <View style={styles.mentorActionContainer}>
            <Text style={styles.mentorLabel}>Mentor Actions</Text>
            <TouchableOpacity style={styles.approveButton} onPress={() => navigation.navigate('LeaveApprovals' as never)}>
              <FileText color={theme.colors.surface} size={20} />
              <Text style={styles.approveButtonText}>Manage Leave Approvals</Text>
            </TouchableOpacity>
          </View>
        )}

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
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...theme.shadows.medium,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    width: '100%',
    padding: 30,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.medium,
  },
  dateText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  digitalClock: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 48,
    color: theme.colors.text,
    letterSpacing: 2,
    marginBottom: 15,
  },
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpsText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    marginLeft: 6,
  },
  buttonWrapper: {
    marginVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButton: {
    backgroundColor: theme.colors.primary,
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  checkOutButton: {
    backgroundColor: theme.colors.destructiveText,
    shadowColor: theme.colors.destructiveText,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  buttonContent: {
    alignItems: 'center',
  },
  checkInText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 22,
    color: theme.colors.surface,
    marginTop: 10,
  },
  statsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    width: '80%',
    ...theme.shadows.subtle,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 24,
    color: theme.colors.text,
  },
  historyLink: {
    padding: 10,
  },
  historyText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  leaveActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  leaveButton: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: 5,
    ...theme.shadows.subtle,
  },
  leaveButtonText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
  },
  mentorActionContainer: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mentorLabel: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 10,
  },
  approveButton: {
    backgroundColor: theme.colors.primary, // Changed from secondary for better contrast
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.subtle,
  },
  approveButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    color: theme.colors.surface,
    marginLeft: 8,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: theme.colors.success,
  },
  resultError: {
    backgroundColor: theme.colors.destructive,
    borderColor: theme.colors.destructiveText,
  },
  resultText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    textAlign: 'center',
  },
  resultSuccessText: {
    color: theme.colors.success,
  },
  resultErrorText: {
    color: theme.colors.destructiveText,
  },
});
