import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AnimatedBackground from '../../../components/AnimatedBackground';
import { GiniAiApi, getGiniAiBaseUrl } from '../api/api';

export default function CharacterHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const data = await GiniAiApi.getCharacters();
      setCharacters(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load characters:', e);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await GiniAiApi.deleteCharacter(id);
      loadCharacters();
    } catch (e) {
      console.error('Failed to delete character:', e);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Gini AI</Text>
            <Text style={styles.subtitle}>Chat with Custom AI Characters</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/gini_ai/creator')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#c084fc" /></View>
        ) : characters.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ color: '#94a3b8', fontSize: 16 }}>No characters yet. Create one!</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.grid}>
              {characters.map((char, index) => (
                <Animated.View key={char.id} entering={FadeInDown.delay(index * 100).springify()} style={styles.cardContainer}>
                  <TouchableOpacity 
                    style={styles.card}
                    onPress={() => router.push({ pathname: '/gini_ai/chat', params: { character: JSON.stringify(char) } })}
                  >
                    <Image source={{ uri: `${getGiniAiBaseUrl()}${char.avatarUrl}` }} style={styles.avatar} />
                    <LinearGradient colors={['transparent', 'rgba(15,23,42,0.9)']} style={styles.gradient} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.charName} numberOfLines={1}>{char.name}</Text>
                      <Text style={styles.charDesc} numberOfLines={2}>{char.description}</Text>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(char.id)}>
                      <Ionicons name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  createBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardContainer: { width: '48%', marginBottom: 16 },
  card: { height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: '100%', height: '100%', position: 'absolute' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  deleteBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  charName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  charDesc: { fontSize: 12, color: '#cbd5e1' }
});
