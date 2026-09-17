import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GiniAiApi, getGiniAiBaseUrl } from '../api/api';

export default function ChatScreen() {
  const { character: charString } = useLocalSearchParams();
  const character = React.useMemo(() => {
    if (!charString) return {};
    try {
      return typeof charString === 'string' ? JSON.parse(charString) : charString;
    } catch {
      return {};
    }
  }, [charString]);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([{ role: 'assistant', content: character.greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadLatestSession();
  }, [character.id]);

  const loadLatestSession = async () => {
    try {
      const session = await GiniAiApi.getLatestSession(character.id);
      if (session) {
        setSessionId(session.id);
        if (session.messages && session.messages.length > 0) {
          setMessages(session.messages);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const data = await GiniAiApi.sendMessage(character.id, msg, sessionId || undefined);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm offline." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text: string) => {
    if (!text) return null;
    let processedText = text.replace(/\{\{user\}\}/gi, 'User').replace(/\{\{char\}\}/gi, character.name);
    
    // Split text by **...** or *...* or (...)
    const regex = /(\*\*.*?\*\*|\*.*?\*|\(.*?\))/g;
    const parts = processedText.split(regex);
    
    return parts.map((part, index) => {
      if (part.match(regex)) {
        return <Text key={index} style={{ color: '#93c5fd', fontStyle: 'italic' }}>{part}</Text>;
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0f172a' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/gini_ai');
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: `${getGiniAiBaseUrl()}${character.avatarUrl}` }} style={styles.headerAvatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{character.name}</Text>
          <Text style={styles.headerSubtitle}>Lightning AI</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
              {!isUser && <Image source={{ uri: `${getGiniAiBaseUrl()}${character.avatarUrl}` }} style={styles.msgAvatar} />}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={styles.msgText}>{renderMessageText(item.content)}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={loading ? (
          <View style={[styles.msgRow, styles.msgRowLeft]}>
            <Image source={{ uri: `${getGiniAiBaseUrl()}${character.avatarUrl}` }} style={styles.msgAvatar} />
            <View style={[styles.bubble, styles.bubbleAi, { paddingHorizontal: 20 }]}>
              <Text style={styles.msgText}>...</Text>
            </View>
          </View>
        ) : null}
      />

      <BlurView intensity={80} tint="dark" style={[styles.inputContainer, { paddingBottom: (insets.bottom || 20) + 80 }]}>
        <TextInput 
          style={styles.input} 
          placeholder={`Message ${character.name}...`} 
          placeholderTextColor="#64748b" 
          value={input} 
          onChangeText={setInput} 
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading || !input.trim()}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'rgba(15,23,42,0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8' },
  msgRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 4 },
  bubble: { padding: 12, borderRadius: 20, flexShrink: 1 },
  bubbleUser: { backgroundColor: '#9333ea', borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  msgText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, height: 44, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22, paddingHorizontal: 16, color: '#fff', fontSize: 15, marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#9333ea', justifyContent: 'center', alignItems: 'center' }
});
