import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Home, BookOpen, Clock, User } from 'lucide-react-native';
import { theme } from './src/theme';

export const AuthContext = React.createContext<{
  session: Session | null;
  setSession: (session: Session | null) => void;
  role: 'Student' | 'Mentor';
  setRole: (role: 'Student' | 'Mentor') => void;
}>({ session: null, setSession: () => {}, role: 'Student', setRole: () => {} });

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import AttendanceHistoryScreen from './src/screens/AttendanceHistoryScreen';
import LeaveRequestScreen from './src/screens/LeaveRequestScreen';
import LeaveStatusScreen from './src/screens/LeaveStatusScreen';
import LeaveApprovalsScreen from './src/screens/LeaveApprovalsScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import MentorStudentsScreen from './src/screens/MentorStudentsScreen';
import CreateTrainingScreen from './src/screens/CreateTrainingScreen';
import CreateScheduleScreen from './src/screens/CreateScheduleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Training') return <BookOpen color={color} size={size} />;
          if (route.name === 'Attendance') return <Clock color={color} size={size} />;
          if (route.name === 'User') return <User color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamilySemiBold,
          fontSize: 12,
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Training" component={TrainingScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="User" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<'Student' | 'Mentor'>('Student'); // Mock role for testing

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, setSession, role, setRole }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session && session.user ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
              <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
              <Stack.Screen name="LeaveStatus" component={LeaveStatusScreen} />
              <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
              <Stack.Screen name="Schedule" component={ScheduleScreen} />
              <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
              <Stack.Screen name="MentorStudents" component={MentorStudentsScreen} />
              <Stack.Screen name="CreateTraining" component={CreateTrainingScreen} />
              <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
