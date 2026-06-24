import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MapPin, Phone, Mail, CheckCircle, XCircle } from 'lucide-react-native';
import { theme } from '../theme';

interface Student {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isCheckedIn: boolean;
  avatarUrl?: string;
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Nguyen Van A',
    role: 'Frontend Intern',
    phone: '098-123-4567',
    email: 'nguyenvana@devplus.edu.vn',
    isCheckedIn: true,
  },
  {
    id: '2',
    name: 'Tran Thi B',
    role: 'Backend Intern',
    phone: '091-234-5678',
    email: 'tranthib@devplus.edu.vn',
    isCheckedIn: true,
  },
  {
    id: '3',
    name: 'Le Van C',
    role: 'UI/UX Intern',
    phone: '090-345-6789',
    email: 'levanc@devplus.edu.vn',
    isCheckedIn: false,
  },
  {
    id: '4',
    name: 'Pham D',
    role: 'Mobile Intern',
    phone: '093-456-7890',
    email: 'phamd@devplus.edu.vn',
    isCheckedIn: false,
  }
];

export default function MentorStudentsScreen() {
  const navigation = useNavigation();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({ total: 24, checkedIn: 20, absent: 4 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.2.28:3000/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStudents(data.data);
          if (data.stats) setStats(data.stats);
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
        <Text style={styles.headerTitle}>My Students</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Checked In</Text>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.checkedIn}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Absent/Leave</Text>
          <Text style={[styles.statValue, { color: theme.colors.destructiveText }]}>{stats.absent}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={students.length > 0 ? students : mockStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentRole}>{item.role}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.isCheckedIn ? '#E8F5E9' : '#FEE2E2' }]}>
                {item.isCheckedIn ? (
                  <CheckCircle color={theme.colors.success} size={14} />
                ) : (
                  <XCircle color={theme.colors.destructiveText} size={14} />
                )}
                <Text style={[styles.statusText, { color: item.isCheckedIn ? theme.colors.success : theme.colors.destructiveText }]}>
                  {item.isCheckedIn ? ' Present' : ' Absent'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactRow}>
              <View style={styles.contactItem}>
                <Phone color={theme.colors.textSecondary} size={16} />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
              <View style={styles.contactItem}>
                <Mail color={theme.colors.textSecondary} size={16} />
                <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
              </View>
            </View>
          </View>
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 15,
    margin: 20,
    marginBottom: 0,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
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
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.primary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  studentRole: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 15,
  },
  contactRow: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
});
