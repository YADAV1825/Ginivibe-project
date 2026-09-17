import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AnimatedBackground from '../../../components/AnimatedBackground';
import { GiniAiApi, getGiniAiBaseUrl } from '../api/api';

export default function CharacterCreatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [avatars, setAvatars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [greeting, setGreeting] = useState('Hello there!');
  const [prompt, setPrompt] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  useEffect(() => {
    GiniAiApi.getAvatars().then(data => {
      setAvatars(data);
      if (data.length > 0) setSelectedAvatar(data[0]);
    });
  }, []);

  const handleCreate = async () => {
    if (!name || !desc || !prompt) return;
    setLoading(true);
    try {
      await GiniAiApi.createCharacter({
        name, description: desc, greeting, systemPrompt: prompt, avatarUrl: selectedAvatar
      });
      router.replace('/gini_ai');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/gini_ai');
            }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Character</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 180 }}>
          <Text style={styles.label}>Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {avatars.map((url, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setSelectedAvatar(url)}
                style={[styles.avatarWrapper, selectedAvatar === url && styles.avatarSelected]}
              >
                <Image source={{ uri: `${getGiniAiBaseUrl()}${url}` }} style={styles.avatarImg} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="e.g. Elon Musk" value={name} onChangeText={setName} />
          
          <Text style={styles.label}>Short Description</Text>
          <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="A brief summary..." value={desc} onChangeText={setDesc} />
          
          <Text style={styles.label}>Initial Greeting</Text>
          <TextInput style={styles.input} placeholderTextColor="#64748b" placeholder="First message they send..." value={greeting} onChangeText={setGreeting} />
          
          <Text style={styles.label}>System Prompt (The Brain)</Text>
          <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} placeholderTextColor="#64748b" placeholder="You are X. You act like Y..." value={prompt} onChangeText={setPrompt} multiline />

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Create Character</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, paddingBottom: 100 },
  form: { padding: 20 },
  label: { fontSize: 14, color: '#94a3b8', marginBottom: 8, fontWeight: '500' },
  avatarWrapper: { width: 70, height: 70, borderRadius: 20, overflow: 'hidden', marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: '#c084fc' },
  avatarImg: { width: '100%', height: '100%' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 20 },
  submitBtn: { backgroundColor: '#9333ea', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
