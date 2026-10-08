import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme';
import { MessageCircle, X, Send, ArrowLeft, Plus } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../../App';

export default function QAScreen() {
  const { session } = useContext(AuthContext);
  const [questions, setQuestions] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Interactive states
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [repliesLoading, setRepliesLoading] = useState(false);

  React.useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('createdAt', { ascending: false });

      if (data) {
        setQuestions(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    setRepliesLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_ticket_replies')
        .select('*')
        .eq('ticketId', ticketId)
        .order('createdAt', { ascending: true });

      if (data) {
        setReplies(data);
      }
    } catch (e) {
      console.error(e);
    }
    setRepliesLoading(false);
  };

  const handleSelectQuestion = (question: any) => {
    setSelectedQuestion(question);
    fetchReplies(question.id);
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedQuestion || !session) return;
    const currentText = replyText;
    setReplyText('');
    try {
      const { error } = await supabase
        .from('support_ticket_replies')
        .insert({
          id: generateUUID(),
          ticketId: selectedQuestion.id,
          message: currentText,
          authorId: session.user.id,
          createdAt: new Date().toISOString()
        });
      
      if (!error) {
        fetchReplies(selectedQuestion.id);
        
        // --- Add Status Update and Notification ---
        if (selectedQuestion.authorId !== session.user.id) {
          // Update status to RESOLVED
          await supabase
            .from('support_tickets')
            .update({ status: 'RESOLVED' })
            .eq('id', selectedQuestion.id);

          // Insert Notification for the student
          await supabase.from('notifications').insert({
            id: generateUUID(),
            userId: selectedQuestion.authorId,
            title: 'Q&A Answered',
            message: `A mentor has replied to your question: "${selectedQuestion.subject}"`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString()
          });
          
          fetchQuestions(); // Refresh list to show RESOLVED status
          // Also update the selectedQuestion locally so UI updates instantly
          setSelectedQuestion({ ...selectedQuestion, status: 'RESOLVED' });
        }
      } else {
        if (Platform.OS === 'web') window.alert(error.message);
        else Alert.alert('Error', error.message);
      }
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Error', e.message);
    }
  };
  
  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim() || !session) return;
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          id: generateUUID(),
          authorId: session.user.id,
          subject: newTitle,
          description: newContent,
          status: 'OPEN',
          category: 'other',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      
      if (!error) {
        setModalVisible(false);
        setNewTitle('');
        setNewContent('');
        fetchQuestions();
        if (Platform.OS === 'web') window.alert('Question posted!');
        else Alert.alert('Success', 'Question posted!');
      } else {
        if (Platform.OS === 'web') window.alert(error.message);
        else Alert.alert('Error', error.message);
      }
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Error', e.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectQuestion(item)}>
      <View style={styles.headerRow}>
        <View style={styles.authorAvatar}>
          <Text style={styles.avatarText}>💬</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>Student</Text>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (item.status === 'ANSWERED' || item.status === 'RESOLVED') ? '#D1FAE5' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: (item.status === 'ANSWERED' || item.status === 'RESOLVED') ? '#10B981' : '#F59E0B' }]}>
            {(item.status === 'ANSWERED' || item.status === 'RESOLVED') ? 'Resolved ✅' : 'Open 🟢'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.questionTitle}>{item.subject}</Text>
      <Text style={styles.questionContent} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.footerRow}>
        <View style={styles.actionButton}>
          <MessageCircle size={18} color={theme.colors.textSecondary} />
          <Text style={styles.actionText}>Tap to View & Reply</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetail = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setSelectedQuestion(null)} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle} numberOfLines={1}>Discussion Thread</Text>
      </View>
      
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={styles.originalPostCard}>
          <Text style={styles.questionTitle}>{selectedQuestion.subject}</Text>
          <Text style={styles.originalPostContent}>{selectedQuestion.description}</Text>
          <Text style={styles.timeText}>Asked on {new Date(selectedQuestion.createdAt).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionHeader}>Replies</Text>
        
        {repliesLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          replies.map(reply => (
            <View key={reply.id} style={styles.replyItem}>
              <View style={[styles.replyAvatar, reply.authorId !== session?.user?.id && { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.replyAvatarText}>{reply.authorId !== session?.user?.id ? '👨‍🏫' : '👩‍🎓'}</Text>
              </View>
              <View style={[styles.replyContentBox, reply.authorId !== session?.user?.id && { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.replyAuthor}>{reply.authorId !== session?.user?.id ? 'Staff / Mentor' : 'Student'}</Text>
                <Text style={styles.replyContent}>{reply.message}</Text>
                <Text style={styles.replyTime}>{new Date(reply.createdAt).toLocaleTimeString()}</Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply here..."
            value={replyText}
            onChangeText={setReplyText}
          />
          <TouchableOpacity 
            style={[styles.sendReplyBtn, !replyText.trim() && { opacity: 0.5 }]} 
            onPress={handleSendReply}
            disabled={!replyText.trim()}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {selectedQuestion ? (
        renderDetail()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Q&A Board</Text>
            <Text style={styles.headerSubtitle}>Ask questions and share knowledge together!</Text>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={questions}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: theme.colors.textSecondary }}>No questions yet. Be the first to ask! 🌟</Text>}
            />
          )}
          
          <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" transparent={Platform.OS !== 'ios'}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeaderDecorated}>
              <View style={styles.modalDragIndicator} />
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitleDecorated}>Ask a Question</Text>
                <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setModalVisible(false)}>
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalContentDecorated} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.inputTitleDecorated}
                placeholder="What do you want to ask?"
                value={newTitle}
                onChangeText={setNewTitle}
                placeholderTextColor="#A0AEC0"
              />
              
              <Text style={styles.inputLabel}>Details</Text>
              <TextInput
                style={styles.inputBodyDecorated}
                placeholder="Explain more about your question so others can help..."
                value={newContent}
                onChangeText={setNewContent}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#A0AEC0"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtnDecorated} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.postBtnDecorated, (!newTitle.trim() || !newContent.trim()) && styles.postBtnDisabled]}
                onPress={handlePost}
                disabled={!newTitle.trim() || !newContent.trim()}
              >
                <Text style={styles.postBtnText}>Post Question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { padding: 20, paddingTop: 60, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 26, fontFamily: theme.typography.fontFamilyBold, color: '#fff' },
  headerSubtitle: { fontSize: 14, fontFamily: theme.typography.fontFamily, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  
  detailHeader: { padding: 20, paddingTop: 60, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  detailHeaderTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: '#fff', flex: 1 },
  
  listContainer: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 16, ...theme.shadows.medium },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22 },
  authorInfo: { flex: 1, marginLeft: 12 },
  authorName: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.text },
  timeText: { fontSize: 12, fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontFamily: theme.typography.fontFamilyBold },

  questionTitle: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.text, marginBottom: 8 },
  questionContent: { fontSize: 15, fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 15 },
  
  footerRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15, marginTop: 5 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  actionText: { fontSize: 13, fontFamily: theme.typography.fontFamilySemiBold, color: theme.colors.textSecondary, marginLeft: 6 },
  
  originalPostCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, ...theme.shadows.medium },
  originalPostContent: { fontSize: 16, fontFamily: theme.typography.fontFamily, color: theme.colors.text, lineHeight: 24, marginBottom: 10 },
  
  sectionHeader: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.text, marginBottom: 15 },
  
  replyItem: { flexDirection: 'row', marginBottom: 15 },
  replyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  replyAvatarText: { fontSize: 16 },
  replyContentBox: { flex: 1, marginLeft: 12, backgroundColor: '#fff', padding: 15, borderRadius: 20, borderTopLeftRadius: 4, ...theme.shadows.subtle },
  replyAuthor: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.text, marginBottom: 4 },
  replyTime: { fontSize: 11, fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, marginTop: 6 },
  replyContent: { fontSize: 15, fontFamily: theme.typography.fontFamily, color: theme.colors.textSecondary, lineHeight: 22 },
  
  replyInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingBottom: 95, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  replyInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontFamily: theme.typography.fontFamily, fontSize: 15 },
  sendReplyBtn: { marginLeft: 10, width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', ...theme.shadows.subtle },

  fab: { position: 'absolute', bottom: 90, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', ...theme.shadows.medium },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBody: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%' },
  modalHeaderDecorated: { padding: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalDragIndicator: { width: 50, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitleDecorated: { fontSize: 22, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.text },
  modalCloseCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  
  modalContentDecorated: { padding: 20 },
  inputLabel: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputTitleDecorated: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 24 },
  inputBodyDecorated: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, fontFamily: theme.typography.fontFamily, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: '#F3F4F6', minHeight: 180 },
  
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 40 },
  cancelBtnDecorated: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyBold, fontSize: 16 },
  postBtnDecorated: { flex: 1, marginLeft: 16, backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', ...theme.shadows.subtle },
  postBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },
  postBtnText: { color: '#fff', fontFamily: theme.typography.fontFamilyBold, fontSize: 16 }
});
