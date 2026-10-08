import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Home, BookOpen, Clock, User, Calendar, MessageSquare } from 'lucide-react-native';
import { theme } from './src/theme';

export type CustomSession = {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }
};

export const AuthContext = React.createContext<{
  session: CustomSession | null;
  setSession: (session: CustomSession | null) => void;
}>({ session: null, setSession: () => {} });

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
import CreateTrainingScreen from './src/screens/CreateTrainingScreen';
import CreateScheduleScreen from './src/screens/CreateScheduleScreen';
import QAScreen from './src/screens/QAScreen';
import MembersScreen from './src/screens/MembersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Events') return <Calendar color={color} size={size} />;
          if (route.name === 'Q&A') return <MessageSquare color={color} size={size} />;
          if (route.name === 'Profile') return <User color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          height: Platform.OS === 'ios' ? 85 : 75,
          paddingBottom: Platform.OS === 'ios' ? 25 : 15,
          paddingTop: 10,
          ...theme.shadows.medium,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamilySemiBold,
          fontSize: 11,
          marginTop: 2,
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={ScheduleScreen} />
      <Tab.Screen name="Q&A" component={QAScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<CustomSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem('session').then((sessionStr) => {
      if (sessionStr) {
        try {
          const parsedSession = JSON.parse(sessionStr);
          setSession(parsedSession);
        } catch (e) {}
      }
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session && session.user ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Training" component={TrainingScreen} />
              <Stack.Screen name="Attendance" component={AttendanceScreen} />
              <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
              <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
              <Stack.Screen name="LeaveStatus" component={LeaveStatusScreen} />
              <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
              <Stack.Screen name="Schedule" component={ScheduleScreen} />
              <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
              <Stack.Screen name="CreateTraining" component={CreateTrainingScreen} />
              <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} />
              <Stack.Screen name="Q&A" component={QAScreen} />
              <Stack.Screen name="Members" component={MembersScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
