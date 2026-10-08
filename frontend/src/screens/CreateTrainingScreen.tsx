import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Image as ImageIcon, FileText, Video, Upload, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../theme';
import { API_BASE_URL } from '../lib/api';

export default function CreateTrainingScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<any>(null);

  const handlePickFile = async (type: 'image' | 'pdf' | 'video') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'image' ? 'image/*' : type === 'pdf' ? 'application/pdf' : 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (type === 'image') setCoverImage(file);
        else if (type === 'pdf') setPdfFile(file);
        else if (type === 'video') setVideoFile(file);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Upload Failed', `There was an error uploading the ${type} file.`);
    }
  };

  const handleCreateProgram = async () => {
    if (!title || !description) {
      Alert.alert('Missing Fields', 'Please fill in both the title and description.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      if (coverImage) {
        formData.append('coverImage', {
          uri: coverImage.uri,
          name: coverImage.name,
          type: coverImage.mimeType || 'image/jpeg',
        } as any);
      }

      if (pdfFile) {
        formData.append('pdfFile', {
          uri: pdfFile.uri,
          name: pdfFile.name,
          type: pdfFile.mimeType || 'application/pdf',
        } as any);
      }

      if (videoFile) {
        formData.append('videoFile', {
          uri: videoFile.uri,
          name: videoFile.name,
          type: videoFile.mimeType || 'video/mp4',
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/training`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed on the server');
      }

      Alert.alert(
        'Success!',
        `Training program "${title}" has been published successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to publish the training program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.surface} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Program</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. React Native Masterclass"
              placeholderTextColor={theme.colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what students will learn..."
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Course Materials</Text>

          {/* Cover Image Upload */}
          <TouchableOpacity style={styles.uploadCard} onPress={() => handlePickFile('image')}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 140, 0, 0.1)' }]}>
              {coverImage ? <CheckCircle color={theme.colors.primary} size={24} /> : <ImageIcon color={theme.colors.primary} size={24} />}
            </View>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>Cover Image</Text>
              <Text style={styles.uploadSub} numberOfLines={1}>
                {coverImage ? coverImage.name : 'Upload a banner image (.png, .jpg)'}
              </Text>
            </View>
            <Upload color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>

          {/* PDF Upload */}
          <TouchableOpacity style={styles.uploadCard} onPress={() => handlePickFile('pdf')}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              {pdfFile ? <CheckCircle color="#EF4444" size={24} /> : <FileText color="#EF4444" size={24} />}
            </View>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>Course Material (PDF)</Text>
              <Text style={styles.uploadSub} numberOfLines={1}>
                {pdfFile ? pdfFile.name : 'Upload reading material (.pdf)'}
              </Text>
            </View>
            <Upload color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>

          {/* Video Upload */}
          <TouchableOpacity style={styles.uploadCard} onPress={() => handlePickFile('video')}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              {videoFile ? <CheckCircle color="#3B82F6" size={24} /> : <Video color="#3B82F6" size={24} />}
            </View>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>Lecture Video</Text>
              <Text style={styles.uploadSub} numberOfLines={1}>
                {videoFile ? videoFile.name : 'Upload main lecture video (.mp4)'}
              </Text>
            </View>
            <Upload color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.submitButton} onPress={handleCreateProgram} disabled={loading}>
          <CheckCircle color={theme.colors.surface} size={20} />
          <Text style={styles.submitButtonText}>{loading ? 'Publishing...' : 'Publish Program'}</Text>
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
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.text,
  },
  textArea: {
    height: 120,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 15,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: theme.borderRadius.md,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 2,
  },
  uploadSub: {
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
  submitButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
  },
  submitButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 16,
    color: theme.colors.surface,
    marginLeft: 10,
  },
});
