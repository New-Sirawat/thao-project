import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, Animated, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, PlayCircle, FileText, CheckCircle, Clock, Video, Download, Info } from 'lucide-react-native';
import { theme } from '../theme';

export default function CourseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const course = route.params?.course || {
    title: 'React Native Masterclass',
    description: 'Learn to build native mobile apps for iOS and Android using React and JavaScript. This comprehensive guide covers navigation, state management, animations, and more.',
    image_url: 'https://reactnative.dev/img/logo-og.png',
    pdf_url: '',
    video_url: '',
    progress: 75,
  };
  const [toastVisible, setToastVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = () => {
    setToastVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Hide after 2 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastVisible(false);
      });
    }, 2000);
  };

  const handleMediaPress = async (url: string | undefined) => {
    if (!url) {
      showToast();
      return;
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast();
      }
    } catch (error) {
      showToast();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: course.image_url || 'https://reactnative.dev/img/logo-og.png' }} 
          style={styles.coverImage} 
        />
        
        <View style={styles.courseInfo}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Mobile Development</Text>
          </View>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description}>
            {course.description}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock color={theme.colors.textSecondary} size={16} />
              <Text style={styles.statText}>12 Hours</Text>
            </View>
            <View style={styles.statItem}>
              <FileText color={theme.colors.textSecondary} size={16} />
              <Text style={styles.statText}>15 Modules</Text>
            </View>
            <View style={styles.statItem}>
              <CheckCircle color={theme.colors.success} size={16} />
              <Text style={[styles.statText, { color: theme.colors.success }]}>75% Done</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '75%' }]} />
          </View>
        </View>

        {/* New Course Materials Section */}
        <View style={styles.materialsSection}>
          <Text style={styles.sectionTitle}>Course Materials</Text>
          <View style={styles.materialsGrid}>
            <TouchableOpacity style={styles.materialCard} onPress={() => handleMediaPress(course.pdf_url)}>
              <View style={[styles.materialIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <FileText color="#EF4444" size={24} />
              </View>
              <Text style={styles.materialTitle}>Read PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.materialCard} onPress={() => handleMediaPress(course.video_url)}>
              <View style={[styles.materialIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Video color="#3B82F6" size={24} />
              </View>
              <Text style={styles.materialTitle}>Watch Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.materialCard} onPress={() => handleMediaPress(course.pdf_url)}>
              <View style={[styles.materialIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Download color="#10B981" size={24} />
              </View>
              <Text style={styles.materialTitle}>Source Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.syllabusSection}>
          <Text style={styles.sectionTitle}>Syllabus</Text>
          
          {(course.syllabus || []).map((item: any, index: number) => (
            <TouchableOpacity key={item.id} style={styles.lessonItem}>
              <View style={styles.lessonIconWrapper}>
                {item.completed ? (
                  <CheckCircle color={theme.colors.success} size={24} />
                ) : (
                  <PlayCircle color={theme.colors.primary} size={24} />
                )}
              </View>
              <View style={styles.lessonInfo}>
                <Text style={[styles.lessonTitle, item.completed && styles.completedText]}>
                  {index + 1}. {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.resumeButton}>
          <PlayCircle color={theme.colors.surface} size={20} />
          <Text style={styles.resumeButtonText}>Resume Course</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Toast Message Overlay */}
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <Info color={theme.colors.surface} size={20} />
          <Text style={styles.toastText}>No data available or file not uploaded yet.</Text>
        </Animated.View>
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 20,
    color: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  courseInfo: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  title: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: 10,
  },
  description: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  materialsSection: {
    padding: 20,
    paddingBottom: 0,
  },
  materialsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  materialCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  materialIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  materialTitle: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  syllabusSection: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 15,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  lessonIconWrapper: {
    marginRight: 15,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 4,
  },
  completedText: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  lessonDuration: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  resumeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
  },
  resumeButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.surface,
    marginLeft: 10,
  },
  toastContainer: {
    position: 'absolute',
    top: 100, // Show near the top
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  toastText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.surface,
    fontSize: 14,
    marginLeft: 10,
  },
});
