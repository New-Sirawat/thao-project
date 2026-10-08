import React, { useEffect, useState, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { theme } from '../theme';
import { Bell, Clock, Calendar, ChevronRight, FileText, Users, Send, ClipboardList, AlertCircle, CheckCircle, Building, Smile, Heart, Sparkles, MapPin } from 'lucide-react-native';
import { AuthContext } from '../../App';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeStr, setTimeStr] = useState<string>('');
  const [hasLeaveHistory, setHasLeaveHistory] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string>('Not Checked In');
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [workingDuration, setWorkingDuration] = useState<string>('00:00:00');
  
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'checkin' | 'checkout' | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // For Web Testing Simulator
  const [simulatedLocation, setSimulatedLocation] = useState<'far' | 'near'>('far');

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Define company coordinates (96 Nguyễn Đình Hoàn, Sơn Trà, Đà Nẵng)
  const COMPANY_LOCATION = {
    latitude: 16.0772,
    longitude: 108.2343
  };
  const MAX_DISTANCE_METERS = 500;
  const DEV_BYPASS_LOCATION = false; // Turned off for testing the popup

  // Haversine formula to calculate distance in meters
  const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Radius of the earth in m
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };

  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        try {
          if (session) {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

            const { data: attData, error: attError } = await supabase
              .from('attendances')
              .select('*')
              .eq('userId', session.user.id)
              .gte('checkIn', startOfDay)
              .lte('checkIn', endOfDay)
              .order('checkIn', { ascending: false })
              .limit(1)
              .single();

            if (attData) {
              if (attData.checkOut) {
                setIsCheckedIn(false);
                setAttendanceStatus('Checked Out');
              } else {
                setIsCheckedIn(true);
                setAttendanceStatus('Checked In');
                setCheckInTime(attData.checkIn);
              }
            } else {
              setIsCheckedIn(false);
              setAttendanceStatus('Not Checked In');
            }

            // Fetch unread notifications count
            const { count, error: countError } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('userId', session.user.id)
              .eq('read', false);
            
            if (!countError && count !== null) {
              setUnreadCount(count);
            }
          }

          const { data: schedData, error: schedError } = await supabase
            .from('training_plans')
            .select('*');

          if (schedData && schedData.length > 0) {
            // Map training_plans to schedule format for UI display
            setSchedules(schedData.map(plan => ({
              id: plan.id,
              title: plan.title,
              time: 'TBA', // Adjust based on your schema
              location: 'Online'
            })));
          } else {
            setSchedules([
              { id: 1, title: 'Welcome to DevPlus!', time: '10:00 AM', location: 'Da Nang HQ' },
              { id: 2, title: 'React Native Basics', time: '2:00 PM', location: 'Online' }
            ]);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    }, [session])
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (isCheckedIn && checkInTime) {
        // Supabase timestamp without time zone returns strings without 'Z'
        const checkInDate = new Date(checkInTime.endsWith('Z') ? checkInTime : checkInTime + 'Z');
        const diffMs = now.getTime() - checkInDate.getTime();
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);
          setWorkingDuration(
            `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
          );
        } else {
          setWorkingDuration('00:00:00');
        }
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleCheckIn = () => {
    setConfirmAction('checkin');
    setConfirmModalVisible(true);
  };

  const handleCheckOut = () => {
    setConfirmAction('checkout');
    setConfirmModalVisible(true);
  };

  const handleResetTest = async () => {
    try {
      if (!session) return;
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('userId', session.user.id)
        .gte('checkIn', startOfDay)
        .lte('checkIn', endOfDay);
        
      setIsCheckedIn(false);
      setAttendanceStatus('Not Checked In');
      setCheckInTime(null);
      setWorkingDuration('00:00:00');
      if (Platform.OS === 'web') {
        window.alert('Reset Success: You can now check in again!');
      } else {
        Alert.alert('Reset Success', 'You can now check in again!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const executeCheckIn = async () => {
    setConfirmModalVisible(false);
    setIsCheckingIn(true);
    try {
      if (!session) {
        setIsCheckingIn(false);
        return;
      }
      
      // Check GPS
      let locationString = 'Da Nang Office';
      if (!DEV_BYPASS_LOCATION) {
        let distance = 0;
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (Platform.OS === 'web') window.alert('Please allow location access in your browser to Check-In.');
          else Alert.alert('Permission Denied', 'Please allow location access to Check-In.');
          setIsCheckingIn(false);
          return;
        }

        const getLocationWithTimeout = async () => {
          try {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown && Date.now() - lastKnown.timestamp < 5 * 60 * 1000) {
              return lastKnown;
            }
          } catch(e) {}

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GPS timeout (> 3 seconds). Please ensure you have a clear view of the sky or try again.')), 3000)
          );
          
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          return Promise.race([locationPromise, timeoutPromise]) as Promise<Location.LocationObject>;
        };

        let location;
        try {
          location = await getLocationWithTimeout();
        } catch (e: any) {
          const msg = e.message || 'Failed to get GPS location.';
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('GPS Error', msg);
          setIsCheckingIn(false);
          return;
        }
        distance = getDistanceFromLatLonInM(
          location.coords.latitude,
          location.coords.longitude,
          COMPANY_LOCATION.latitude,
          COMPANY_LOCATION.longitude
        );
        locationString = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;

        // If user explicitly clicks the "Mock" button on Web to test being near, override it
        if (Platform.OS === 'web' && simulatedLocation === 'near') {
          distance = 10;
        }

        if (distance > MAX_DISTANCE_METERS) {
          const distMsg = `You are ${Math.round(distance)}m away from the office. Must be within ${MAX_DISTANCE_METERS}m.`;
          if (Platform.OS === 'web') {
            window.alert('Too Far: ' + distMsg);
          } else {
            Alert.alert('Too Far', distMsg);
          }
          setIsCheckingIn(false);
          return;
        }
      }

      const now = new Date();
      
      let determinedStatus = 'PRESENT';
      if (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15)) {
        determinedStatus = 'LATE';
      }

      const { data, error } = await supabase
        .from('attendances')
        .insert({
          id: generateUUID(),
          userId: session.user.id,
          date: now.toISOString().split('T')[0],
          checkIn: now.toISOString(),
          checkInIp: '192.168.1.100', // Mock IP
          checkInLocation: locationString,
          status: determinedStatus,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        })
        .select()
        .single();
      
      if (!error && data) {
        setIsCheckedIn(true);
        setAttendanceStatus('Checked In');
        setCheckInTime(data.checkIn);
        
        // --- Refresh Dashboard Data immediately ---
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const { data: attData } = await supabase
          .from('attendances')
          .select('*')
          .eq('userId', session.user.id)
          .gte('checkIn', startOfDay)
          .lte('checkIn', endOfDay)
          .order('checkIn', { ascending: false })
          .limit(1)
          .single();

        if (attData) {
          if (attData.checkOut) {
            setIsCheckedIn(false);
            setAttendanceStatus('Checked Out');
          } else {
            setIsCheckedIn(true);
            setAttendanceStatus('Checked In');
            setCheckInTime(attData.checkIn);
          }
        }
        
      } else {
        if (Platform.OS === 'web') {
          window.alert('Check-In Failed: ' + (error?.message || 'Please try again'));
        } else {
          Alert.alert('Check-In Failed', error?.message || 'Please try again');
        }
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + e.message);
      } else {
        Alert.alert('Error', e.message);
      }
    }
    setIsCheckingIn(false);
  };

  const executeCheckOut = async () => {
    setConfirmModalVisible(false);
    setIsCheckingIn(true);
    try {
      if (!session) {
        setIsCheckingIn(false);
        return;
      }
      const now = new Date().toISOString();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      
      const { error } = await supabase
        .from('attendances')
        .update({ 
          checkOut: now, 
          checkOutIp: '192.168.1.100', 
          checkOutLocation: 'Da Nang Office',
          updatedAt: now
        })
        .eq('userId', session.user.id)
        .gte('checkIn', startOfDay)
        .is('checkOut', null);
      
      if (!error) {
        setIsCheckedIn(false);
        setAttendanceStatus('Checked Out');
      } else {
        if (Platform.OS === 'web') {
          window.alert('Check-Out Failed: ' + (error.message || 'Please try again'));
        } else {
          Alert.alert('Check-Out Failed', error.message || 'Please try again');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setIsCheckingIn(false);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'N';
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatarContainer}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{getInitials(session?.user?.name || 'Nguyen Van A')}</Text>
            </View>
            <View>
              <Text style={styles.headerRole}>STUDENT</Text>
              <Text style={styles.headerName}>{session?.user?.name || 'Nguyen Van A'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notifications' as never)}>
            <Bell color={theme.colors.surface} size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFF0E6' }]}>
              <Clock color={theme.colors.primary} size={24} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{workingDuration}</Text>
              <Text style={styles.statLabel}>Working Time</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Calendar color="#EF4444" size={24} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Events Today</Text>
            </View>
          </View>
        </View>

        {/* Attendance Widget */}
        <View style={styles.attendanceWidget}>
           <TouchableOpacity 
             style={[styles.attendanceBtn, !isCheckedIn && attendanceStatus !== 'Checked Out' ? styles.checkInBtn : styles.disabledBtn]} 
             onPress={handleCheckIn}
             disabled={isCheckedIn || isCheckingIn || attendanceStatus === 'Checked Out'}
           >
             <Text style={!isCheckedIn && attendanceStatus !== 'Checked Out' ? styles.attendanceBtnText : styles.attendanceBtnTextDark}>
               {isCheckingIn && !isCheckedIn ? 'Wait...' : 'Check In'}
             </Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={[styles.attendanceBtn, isCheckedIn ? styles.checkOutBtnActive : styles.disabledBtn]} 
             onPress={handleCheckOut}
             disabled={!isCheckedIn || isCheckingIn}
           >
             <Text style={isCheckedIn ? styles.attendanceBtnText : styles.attendanceBtnTextDark}>
               {isCheckingIn && isCheckedIn ? 'Wait...' : 'Check Out'}
             </Text>
           </TouchableOpacity>
        </View>
        
        {/* Helper to reset demo */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 10}}>
          <TouchableOpacity onPress={handleResetTest} style={[styles.resetDemoBtn, { flex: 1, marginRight: 5 }]}>
            <Text style={styles.resetDemoText}>Reset Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setSimulatedLocation('near');
            if (Platform.OS === 'web') {
              window.alert('จำลองว่าคุณยืนอยู่ในระยะ 500 เมตรแล้ว! (Mock Near)');
            } else {
              Alert.alert('Bypass', 'จำลองว่าคุณยืนอยู่ในระยะ 500 เมตรแล้ว! (Mock Near)');
            }
          }} style={[styles.resetDemoBtn, { flex: 1, marginLeft: 5, backgroundColor: simulatedLocation === 'near' ? '#10B981' : '#3B82F6' }]}>
            <Text style={[styles.resetDemoText, { color: '#fff' }]}>{simulatedLocation === 'near' ? 'Location: Near' : 'Mock: Get Near'}</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule' as never)} style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.upcomingList}>
          {schedules.slice(0, 3).map((sched: any, index: number) => {
            const colors = [theme.colors.eventToday, theme.colors.eventTomorrow, theme.colors.eventFuture];
            const color = colors[index % colors.length];
            const labelText = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Mar 22';
            return (
              <TouchableOpacity key={sched.id || index} style={[styles.upcomingCard, { borderLeftColor: color }]} onPress={() => navigation.navigate('Schedule' as never)}>
                <View style={[styles.upcomingDateBox, { borderColor: color }]}>
                  <Calendar color={color} size={16} />
                  <Text style={[styles.upcomingDateText, { color }]}>{labelText}</Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingTitle}>{sched.title}</Text>
                  <View style={styles.upcomingDetailsRow}>
                    <Calendar color={theme.colors.textSecondary} size={12} />
                    <Text style={styles.upcomingDetailsText}>{sched.time}</Text>
                    {sched.location && (
                      <>
                        <Text style={styles.upcomingDetailsDot}>•</Text>
                        <MapPinIcon />
                        <Text style={styles.upcomingDetailsText}>{sched.location}</Text>
                      </>
                    )}
                  </View>
                </View>
                <ChevronRight color={theme.colors.border} size={20} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity style={styles.quickAccessBox} onPress={() => navigation.navigate('Training' as never)}>
              <View style={styles.quickAccessIconWrapper}>
                <FileText color={theme.colors.primary} size={24} />
              </View>
              <Text style={styles.quickAccessText}>Training{'\n'}Program</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessBox} onPress={() => navigation.navigate('LeaveRequest' as never)}>
              <View style={styles.quickAccessIconWrapper}>
                <Send color={theme.colors.primary} size={24} />
              </View>
              <Text style={styles.quickAccessText}>Leave{'\n'}Request</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity style={styles.quickAccessBox} onPress={() => navigation.navigate('Attendance' as never)}>
              <View style={styles.quickAccessIconWrapper}>
                <ClipboardList color={theme.colors.primary} size={24} />
              </View>
              <Text style={styles.quickAccessText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessBox} onPress={() => navigation.navigate('Members' as never)}>
              <View style={styles.quickAccessIconWrapper}>
                <Users color={theme.colors.primary} size={24} />
              </View>
              <Text style={styles.quickAccessText}>Members</Text>
            </TouchableOpacity>
          </View>
        </View>
        
      </ScrollView>

      {/* Confirm Action Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconWrapper, { backgroundColor: confirmAction === 'checkin' ? '#D1FAE5' : '#FEE2E2' }]}>
              {confirmAction === 'checkin' ? (
                <Sparkles color="#10B981" size={32} />
              ) : (
                <Heart color="#EF4444" size={32} />
              )}
            </View>
            <Text style={styles.modalTitle}>
              {confirmAction === 'checkin' ? 'Ready to start?' : 'Ready to finish?'}
            </Text>
            <Text style={styles.modalMessage}>
              Do you want to <Text style={[styles.modalMessageBold, { color: confirmAction === 'checkin' ? '#10B981' : '#EF4444' }]}>{confirmAction === 'checkin' ? 'Check-In' : 'Check-Out'}</Text>?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmModalVisible(false)}>
                <Text style={styles.modalCancelText}>Not yet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, { backgroundColor: confirmAction === 'checkin' ? '#10B981' : '#EF4444' }]} 
                onPress={confirmAction === 'checkin' ? executeCheckIn : executeCheckOut}
              >
                <Text style={styles.modalConfirmText}>{confirmAction === 'checkin' ? "Let's go!" : 'Finish!'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Minimal MapPin icon component for details row
const MapPinIcon = () => (
  <View style={{ marginLeft: 6, marginTop: 1 }}>
    <MapPin size={10} color={theme.colors.textSecondary} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.surface,
  },
  headerRole: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 10,
    color: theme.colors.surface,
    opacity: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerName: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.surface,
  },
  bellButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    backgroundColor: theme.colors.destructiveText,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilyBold,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    ...theme.shadows.subtle,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  attendanceWidget: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 10,
    ...theme.shadows.subtle,
  },
  attendanceBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  checkInBtn: {
    backgroundColor: '#10B981', 
  },
  checkOutBtnActive: {
    backgroundColor: '#EF4444', 
  },
  disabledBtn: {
    backgroundColor: '#F3F4F6',
  },
  attendanceBtnText: {
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.surface,
    fontSize: 14,
  },
  attendanceBtnTextDark: {
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  resetDemoBtn: {
    alignSelf: 'center',
    marginBottom: 20,
    padding: 10,
  },
  resetDemoText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
  upcomingList: {
    marginBottom: 20,
  },
  upcomingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 4,
    ...theme.shadows.subtle,
  },
  upcomingDateBox: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#FAFAFA',
  },
  upcomingDateText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 10,
    marginTop: 4,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 6,
  },
  upcomingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingDetailsText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  upcomingDetailsDot: {
    color: theme.colors.textSecondary,
    marginHorizontal: 6,
    fontSize: 12,
  },
  quickAccessGrid: {
    marginBottom: 30,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickAccessBox: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
    ...theme.shadows.subtle,
  },
  quickAccessIconWrapper: {
    backgroundColor: theme.colors.quickAccessBg || '#FFF3E0',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickAccessText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 30,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  modalMessageBold: {
    fontFamily: theme.typography.fontFamilyBold,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalConfirmText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 15,
    color: theme.colors.surface,
  },
});
