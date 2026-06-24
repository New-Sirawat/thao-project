import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Megaphone, Calendar as CalendarIcon, ChevronRight } from 'lucide-react-native';
import { theme } from '../theme';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  isImportant: boolean;
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Weekly Sync Meeting',
    content: 'Please join the weekly sync meeting today at 2:00 PM via Google Meet. We will discuss the upcoming sprint goals and review last week\'s progress.',
    date: 'Today, 10:00 AM',
    author: 'Project Manager',
    isImportant: true,
  },
  {
    id: '2',
    title: 'Submit Weekly Report',
    content: 'A gentle reminder to submit your weekly progress report by tomorrow 5:00 PM. Please include any blockers you are currently facing.',
    date: 'Yesterday',
    author: 'HR Department',
    isImportant: true,
  },
  {
    id: '3',
    title: 'Office Team Building Event',
    content: 'We are organizing a team building event next Friday. Please vote for your preferred activity in the Slack channel.',
    date: '3 days ago',
    author: 'Event Committee',
    isImportant: false,
  },
  {
    id: '4',
    title: 'New React Native Guidelines',
    content: 'The engineering team has updated the React Native coding guidelines. Please review the document in the shared drive.',
    date: 'Last week',
    author: 'Tech Lead',
    isImportant: false,
  }
];

export default function AnnouncementsScreen() {
  const navigation = useNavigation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.2.28:3000/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setAnnouncements(data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={announcements.length > 0 ? announcements : mockAnnouncements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <View style={[styles.dot, item.isImportant && styles.importantDot]} />
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              </View>
              {item.isImportant && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Important</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
            
            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <CalendarIcon color={theme.colors.textSecondary} size={14} />
                <Text style={styles.footerText}>{item.date}</Text>
              </View>
              <Text style={styles.author}>By {item.author}</Text>
            </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    marginRight: 10,
  },
  importantDot: {
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 10,
    color: theme.colors.primary,
  },
  content: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 5,
  },
  author: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.primary,
  },
});
