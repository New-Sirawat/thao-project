import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogOut, User, Mail, Briefcase, MapPin, Edit3, X, Save } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { AuthContext } from '../../App';

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editPhone, setEditPhone] = useState('098-765-4321');
  const [editLocation, setEditLocation] = useState('Đà Nẵng Campus');
  const { setSession, role, setRole } = useContext(AuthContext);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setEmail(session.user.email || '');
    }
  };

  const handleSaveProfile = () => {
    // In a real app, send update to backend
    setIsEditModalVisible(false);
    Alert.alert('Success', 'Profile updated successfully!');
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
              // Force offline logout fallback
              Alert.alert('Offline Mode', 'คุณออกจากระบบแบบออฟไลน์แล้ว (You logged out offline)');
            }
            // Forcefully clear session state in App.tsx to unmount MainTabs and show LoginScreen
            setSession(null);
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
        <TouchableOpacity style={styles.editIconButton} onPress={() => setIsEditModalVisible(true)}>
          <Edit3 color={theme.colors.surface} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User color={theme.colors.surface} size={40} />
          </View>
          <Text style={styles.nameText}>Intern Student</Text>
          <Text style={styles.roleText}>Frontend Developer Intern</Text>
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
              <Text style={styles.infoLabel}>Role (Tap to Switch)</Text>
              <TouchableOpacity onPress={() => setRole(role === 'Student' ? 'Mentor' : 'Student')} style={styles.roleToggle}>
                <Text style={styles.roleToggleText}>Current: {role} 🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <User color={theme.colors.primary} size={20} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{editPhone}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <MapPin color={theme.colors.primary} size={20} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Office Location</Text>
              <Text style={styles.infoValue}>{editLocation}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={theme.colors.destructiveText} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Edit Profile Modal */}
        <Modal visible={isEditModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <X color={theme.colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput 
                style={styles.inputField}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Office Location</Text>
              <TextInput 
                style={styles.inputField}
                value={editLocation}
                onChangeText={setEditLocation}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Save color={theme.colors.surface} size={20} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.colors.text,
  },
  roleToggle: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleToggleText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    color: theme.colors.surface,
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
  editIconButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    padding: 5,
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
    padding: 20,
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
    marginBottom: 5,
  },
  inputField: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
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
