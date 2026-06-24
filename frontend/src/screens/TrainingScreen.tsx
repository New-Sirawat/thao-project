import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { PlayCircle, CheckCircle, Upload, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../theme';
import { AuthContext } from '../../App';

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  progress: number;
  image_url: string;
}

import { useNavigation } from '@react-navigation/native';
export default function TrainingScreen() {
  const navigation = useNavigation();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = React.useContext(AuthContext);

  useEffect(() => {
    fetchTrainingPrograms();
  }, []);

  const fetchTrainingPrograms = async () => {
    try {
      const response = await fetch('http://192.168.2.28:3000/api/training');
      const result = await response.json();
      if (response.ok && result.data) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch training programs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = () => {
    navigation.navigate('CreateTraining' as never);
  };

  const renderProgressBar = (progress: number) => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    );
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Training Programs</Text>
      </View>

      {/* Mentor Action: Upload Plan */}
      {role === 'Mentor' && (
        <View style={styles.mentorActionContainer}>
          <Text style={styles.mentorLabel}>Mentor Actions</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleCreateProgram}>
            <Upload color={theme.colors.surface} size={20} />
            <Text style={styles.uploadButtonText}>Create Training Program</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Try to load image, fallback to solid color if URL fails */}
            <View style={styles.imagePlaceholder}>
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.cardImage} 
                resizeMode="cover"
                defaultSource={require('../../assets/icon.png')}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              
              {renderProgressBar(item.progress)}

              <TouchableOpacity 
                style={[styles.actionButton, item.progress === 100 && styles.actionButtonCompleted]}
                onPress={() => navigation.navigate('CourseDetail' as never, { course: item } as never)}
              >
                {item.progress === 100 ? (
                  <>
                    <CheckCircle color={theme.colors.success} size={18} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.success }]}>Completed</Text>
                  </>
                ) : (
                  <>
                    <PlayCircle color={theme.colors.surface} size={18} />
                    <Text style={styles.actionButtonText}>Continue Learning</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  mentorActionContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  mentorLabel: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary, // Changed from secondary for better contrast
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.subtle,
  },
  uploadButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    color: theme.colors.surface,
    marginLeft: 8,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 20,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(255, 140, 0, 0.2)', // Orange tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 5,
  },
  cardDescription: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonCompleted: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  actionButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 14,
    color: theme.colors.surface,
    marginLeft: 8,
  },
});
