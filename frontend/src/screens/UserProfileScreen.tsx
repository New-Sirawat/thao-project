import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogOut, Mail, MapPin, Edit3, X, Save, Lock, Phone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { AuthContext } from '../../App';

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Student');
  const [role, setRole] = useState('STUDENT');
  const [editPhone, setEditPhone] = useState('+84 123 456 789');
  const [editLocation, setEditLocation] = useState('Ho Chi Minh City');
  const { session, setSession } = useContext(AuthContext);
  
  useEffect(() => {
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    if (!session) {
      setEmail('student@devplus.com');
      return;
    }
    
    setEmail(session.user.email || 'student@devplus.com');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (data) {
      if (data.full_name) setName(data.full_name);
      else if ((session.user as any).user_metadata?.name) setName((session.user as any).user_metadata.name);
      else if ((session.user as any).name) setName((session.user as any).name);
      
      if (data.role) setRole(data.role);
      
      if (data.phone) setEditPhone(data.phone);
      if (data.location) setEditLocation(data.location);
    } else if ((session.user as any).user_metadata?.name) {
      setName((session.user as any).user_metadata.name);
    } else if ((session.user as any).name) {
      setName((session.user as any).name);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (Platform.OS === 'web') {
          window.alert('Offline Mode: You have logged out offline.');
        } else {
          Alert.alert('Offline Mode', 'You have logged out offline.');
        }
      }
      await AsyncStorage.removeItem('session');
      setSession(null);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: performLogout
          }
        ]
      );
    }
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'N';
  };

  return (
    <View style={styles.container}>
      {/* Orange Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerSubtitle}>MY ACCOUNT</Text>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitial(name)}</Text>
            </View>
            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.roleText}>{role ? role.toUpperCase() : 'STUDENT'}</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.infoRow}>
              <Mail color={theme.colors.textSecondary} size={18} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Phone color={theme.colors.textSecondary} size={18} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{editPhone}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MapPin color={theme.colors.textSecondary} size={18} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{editLocation}</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color={theme.colors.destructiveText} size={18} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topHeader: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 10,
    color: theme.colors.surface,
    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 24,
    color: theme.colors.surface,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    ...theme.shadows.medium,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 32,
    color: theme.colors.surface,
  },
  nameText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  roleText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.text,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 15,
  },
  infoLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.destructive,
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
  },
  logoutText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    color: theme.colors.destructiveText,
    marginLeft: 8,
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
    padding: 24,
    width: '90%',
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  inputLabel: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
    marginTop: 10,
  },
  saveButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.surface,
    marginLeft: 8,
  },
});
