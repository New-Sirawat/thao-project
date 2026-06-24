import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogOut, User, Mail, Briefcase, MapPin } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Frontend Developer Intern'); // Default role
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setEmail(session.user.email || '');
      // In a real app, you would fetch name/role from the 'users' table using session.user.id
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
            // Supabase auth state listener in App.tsx will auto-redirect to Login
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User color={theme.colors.surface} size={40} />
          </View>
          <Text style={styles.nameText}>Intern Student</Text>
          <Text style={styles.roleText}>{name}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Mail color={theme.colors.primary} size={20} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Briefcase color={theme.colors.primary} size={20} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>Software Engineering</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <MapPin color={theme.colors.primary} size={20} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Office Location</Text>
              <Text style={styles.infoValue}>Đà Nẵng Campus</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={theme.colors.destructiveText} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
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
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...theme.shadows.medium,
    borderWidth: 4,
    borderColor: 'rgba(255, 140, 0, 0.2)',
  },
  nameText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 22,
    color: theme.colors.text,
  },
  roleText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 30,
    ...theme.shadows.subtle,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    padding: 10,
    borderRadius: 12,
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 5,
    marginLeft: 50,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.destructive,
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.subtle,
  },
  logoutText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.destructiveText,
    marginLeft: 10,
  },
});
