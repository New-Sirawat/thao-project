import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { theme } from '../theme';
import { Mail, ArrowLeft, Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../../App';

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  statusColor: string;
}

export default function MembersScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { session } = React.useContext(AuthContext);

  const [members, setMembers] = useState<Member[]>([]);
  const [teamName, setTeamName] = useState<string>('Company Members');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused && session) {
      fetchMembers();
    }
  }, [isFocused, session]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // 1. Fetch current user's profile to get teamId and companyId
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (userError) throw userError;

      // 2. Fetch team name if they have a teamId
      if (currentUser.teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name')
          .eq('id', currentUser.teamId)
          .single();
        if (teamData) {
          setTeamName(teamData.name);
        }
      } else {
        setTeamName('All Company Members');
      }

      // 3. Build query for members based on role
      let query = supabase.from('users').select('*');
      
      if (currentUser.role === 'STUDENT' && currentUser.teamId) {
        // Students only see members in their team OR their mentor
        if (currentUser.mentorId) {
          query = query.or(`teamId.eq.${currentUser.teamId},id.eq.${currentUser.mentorId}`);
        } else {
          query = query.eq('teamId', currentUser.teamId);
        }
      } else if (currentUser.companyId) {
        // Mentors/Admins see everyone in the company
        query = query.eq('companyId', currentUser.companyId);
      }

      const { data: membersData, error: membersError } = await query;
      if (membersError) throw membersError;

      // 4. Format data for FlatList
      if (membersData) {
        // Fetch today's attendances for all fetched users to compute real-time status
        const today = new Date().toISOString().split('T')[0];
        const userIds = membersData.map((u: any) => u.id);
        
        const { data: attendanceData } = await supabase
          .from('attendances')
          .select('userId, checkIn, checkOut, status')
          .eq('date', today)
          .in('userId', userIds);

        const attendanceMap: Record<string, any> = {};
        if (attendanceData) {
          attendanceData.forEach((att: any) => {
            attendanceMap[att.userId] = att;
          });
        }

        const formattedMembers = membersData.map((m: any) => {
          let computedStatus = 'OFFLINE';
          let computedColor = theme.colors.textSecondary; // Grey by default
          
          const att = attendanceMap[m.id];
          if (att) {
            if (att.status === 'ON_LEAVE') {
              computedStatus = 'ON LEAVE';
              computedColor = theme.colors.eventTomorrow; // Blue
            } else if (att.status === 'ABSENT') {
              computedStatus = 'ABSENT';
              computedColor = theme.colors.destructiveText; // Red
            } else if (att.checkIn && !att.checkOut) {
              if (att.status === 'LATE') {
                computedStatus = 'LATE';
                computedColor = theme.colors.warning; // Yellow
              } else {
                computedStatus = 'ONLINE';
                computedColor = theme.colors.success; // Green
              }
            } else if (att.checkOut) {
              computedStatus = 'OFFLINE';
              computedColor = theme.colors.textSecondary; // Grey
            }
          }

          return {
            id: m.id,
            name: m.name || 'Unknown',
            role: m.role || 'Member',
            email: m.email || '',
            status: computedStatus,
            statusColor: computedColor
          };
        });
        
        // Sort: MENTOR and SUPER_ADMIN first, then alphabetically
        formattedMembers.sort((a, b) => {
          const aIsLeader = a.role === 'MENTOR' || a.role === 'SUPER_ADMIN';
          const bIsLeader = b.role === 'MENTOR' || b.role === 'SUPER_ADMIN';
          if (aIsLeader && !bIsLeader) return -1;
          if (!aIsLeader && bIsLeader) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Member }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>{item.role.replace('_', ' ')}</Text>
        <View style={styles.emailRow}>
          <Mail size={14} color={theme.colors.textSecondary} />
          <Text style={styles.email}>{item.email}</Text>
        </View>
      </View>
      {/* Show dynamic dot color based on real attendance status */}
      <View style={[styles.statusIndicator, { backgroundColor: item.statusColor }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Members
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <View style={styles.teamHeaderContainer}>
              <View style={styles.teamHeaderIcon}>
                <Users size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.teamHeaderText}>{teamName}</Text>
              <Text style={styles.teamCountText}>{members.length} Members</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.surface },
  list: { padding: 20 },
  
  teamHeaderContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  teamHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  teamHeaderText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  teamCountText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, ...theme.shadows.subtle },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.primary },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.text },
  role: { fontSize: 14, fontFamily: theme.typography.fontFamily, color: theme.colors.primary, marginTop: 2 },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  email: { fontSize: 12, fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginLeft: 6 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 }
});
