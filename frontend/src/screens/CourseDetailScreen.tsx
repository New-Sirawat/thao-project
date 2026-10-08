import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, Animated, Linking, SafeAreaView, Platform } from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { ArrowLeft, PlayCircle, FileText, CheckCircle, Clock, Video, Download, Info, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
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
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && course?.id) {
      fetchModules();
    }
  }, [isFocused, course?.id]);

  const fetchModules = async () => {
    const { data } = await supabase
      .from('training_plan_modules')
      .select('*')
      .eq('trainingPlanId', course.id)
      .order('weekNumber', { ascending: true });
    
    if (data) setModules(data);
  };

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

  const handleMediaPress = async (type: 'pdf' | 'load' | 'video', url: string | undefined) => {
    if (type === 'pdf') {
      if (url) {
        setCurrentPdfUrl(url);
        setPdfModalVisible(true);
      } else {
        showToast();
      }
      return;
    }
    
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
          </View>
        </View>



        <View style={styles.syllabusSection}>
          <Text style={styles.sectionTitle}>Syllabus</Text>
          
          {(modules.length > 0 ? modules : (course.syllabus || [])).map((item: any, index: number) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.lessonItem}
              onPress={() => {
                if (item.fileUrl) {
                  handleMediaPress('pdf', item.fileUrl);
                }
              }}
            >
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
              {item.fileUrl && (
                <TouchableOpacity 
                  style={{ padding: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, marginLeft: 10 }}
                  onPress={() => {
                    handleMediaPress('load', item.fileUrl);
                  }}
                >
                  <Download color="#10B981" size={20} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Toast Message Overlay */}
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <Info color="#fff" size={20} />
          <Text style={styles.toastText}>Material link is unavailable</Text>
        </Animated.View>
      )}

      {/* PDF Webview Modal */}
      <Modal
        visible={pdfModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPdfModalVisible(false)}
      >
        <SafeAreaView style={{ backgroundColor: '#F97316', flex: 1 }}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity onPress={() => setPdfModalVisible(false)} style={styles.pdfCloseBtn}>
              <X color="#fff" size={24} />
              <Text style={styles.pdfCloseBtnText}>Close PDF</Text>
            </TouchableOpacity>
            <Text style={styles.pdfTitle} numberOfLines={1}>{course.title}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#E5E7EB', zIndex: 1 }}>
            {currentPdfUrl ? (
              Platform.OS === 'web' ? (
                <iframe 
                  src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(currentPdfUrl)}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <WebView 
                  source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(currentPdfUrl)}` }}
                  style={{ flex: 1 }}
                  startInLoadingState={true}
                />
              )
            ) : (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>No PDF URL Available</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  courseInfo: {
    padding: 20,
    backgroundColor: theme.colors.surface,
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
  toastContainer: {
    position: 'absolute',
    top: 100,
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
  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316', // Orange header tab
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 0,
    borderBottomColor: '#E8630A',
    zIndex: 10,
    elevation: 10,
  },
  pdfCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
  },
  pdfCloseBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamilyBold,
    marginLeft: 6,
    fontSize: 16,
  },
  pdfTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 16,
    color: '#ffffff',
    paddingHorizontal: 10,
  },
  pdfContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPageMock: {
    width: '100%',
    aspectRatio: 1 / 1.414,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  pdfPageText: {
    marginTop: 20,
    fontSize: 24,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamilyBold,
  },
  pdfTextLines: {
    width: '100%',
    marginTop: 40,
    gap: 15,
  },
  pdfLine: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: 6,
    width: '100%',
  },
  pdfControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    elevation: 10,
    borderTopColor: theme.colors.border,
  },
  pdfControlBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  pdfControlBtnDisabled: {
    backgroundColor: theme.colors.border,
  },
  pdfControlText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamilySemiBold,
  },
  pdfPageIndicator: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.text,
    fontSize: 16,
  }
});
