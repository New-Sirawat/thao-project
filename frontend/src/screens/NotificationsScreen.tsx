import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, CheckCircle, Info, AlertTriangle } from 'lucide-react-native';
import { theme } from '../theme';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Leave Request Approved',
    description: 'Your sick leave request for tomorrow has been approved.',
    time: '2 hours ago',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'New Training Plan Available',
    description: 'A new React Native advanced module has been uploaded.',
    time: '5 hours ago',
    type: 'info',
    read: false,
  },
  {
    id: '3',
    title: 'Check-in Reminder',
    description: 'You haven\'t checked in today. Please check in soon.',
    time: '1 day ago',
    type: 'warning',
    read: true,
  },
  {
    id: '4',
    title: 'System Update',
    description: 'The app will undergo maintenance this Sunday at 2:00 AM.',
    time: '2 days ago',
    type: 'info',
    read: true,
  }
];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.2.28:3000/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setNotifications(data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle color={theme.colors.success} size={24} />;
      case 'warning': return <AlertTriangle color={theme.colors.warning} size={24} />;
      default: return <Info color={theme.colors.primary} size={24} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications.length > 0 ? notifications : mockNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, !item.read && styles.unreadCard]}>
            <View style={styles.iconWrapper}>
              {getIcon(item.type)}
            </View>
            <View style={styles.contentWrapper}>
              <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
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
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 140, 0, 0.05)',
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  iconWrapper: {
    marginRight: 15,
    paddingTop: 2,
  },
  contentWrapper: {
    flex: 1,
  },
  title: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  unreadText: {
    fontFamily: theme.typography.fontFamilyBold,
  },
  description: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
});
