import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function NewChatScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/messages');
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Start a Chat</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.iconGradient}
          >
            <Ionicons name="heart-outline" size={44} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.heading}>Connect Through Matching</Text>
        <Text style={styles.description}>
          Direct random searches are disabled. To talk with someone, browse profiles in Non-Live Matching and send them a message request.
        </Text>
        <Text style={styles.subDescription}>
          Once they accept your request (or you accept one in your Requests tab), your direct conversation will automatically unlock!
        </Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.replace('/(tabs)/matching' as any)}
        >
          <LinearGradient
            colors={['#9333ea', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Ionicons name="sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Explore Non-Live Matching</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    marginRight: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  iconWrap: {
    marginBottom: 24,
    borderRadius: 36,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  subDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 32,
  },
  actionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});