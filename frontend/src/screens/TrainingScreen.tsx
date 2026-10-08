import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FileText, ArrowLeft } from 'lucide-react-native';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  progress: number;
  image_url?: string;
  pdf_url?: string;
  video_url?: string;
  created_at?: string;
  file_size?: string;
  file_count?: number;
}

import { useNavigation, useIsFocused } from '@react-navigation/native';
export default function TrainingScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchTrainingPrograms();
    }
  }, [isFocused]);

  const fetchTrainingPrograms = async () => {
    try {
      const { data, error } = await supabase.from('training_plans').select('*, training_plan_modules(*)');
      if (data) {
        const formatted = data.map((item: any) => {
          const modules = item.training_plan_modules || [];
          const files = modules.filter((m: any) => m.fileUrl != null);
          const fileCount = files.length;
          const sizeMB = fileCount > 0 ? (fileCount * 1.5).toFixed(1) + ' MB' : '0 MB';

          return {
            id: item.id,
            title: item.title,
            description: item.description || 'Core curriculum',
            progress: 0,
            created_at: item.createdAt,
            file_size: sizeMB,
            file_count: fileCount
          };
        });
        setPrograms(formatted as TrainingProgram[]);
      }
    } catch (error) {
      console.error('Failed to fetch training programs', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Programs</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const fileCount = item.file_count || 0;
          const uploadDate = item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '25 Jun 2026';
          const fileSize = item.file_size || '0 MB';

          return (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => (navigation.navigate as any)('CourseDetail', { course: item })}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconContainer}>
                    <FileText color={theme.colors.primary} size={24} />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Files</Text>
                    <Text style={styles.statValue}>{fileCount} items</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Size</Text>
                    <Text style={styles.statValue}>{fileSize}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Uploaded</Text>
                    <Text style={styles.statValue}>{uploadDate}</Text>
                  </View>
                </View>

              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 0,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardContent: {
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
});
