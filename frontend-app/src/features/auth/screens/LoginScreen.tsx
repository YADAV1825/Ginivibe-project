import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../providers/AuthProvider';

const API_URL = 'http://127.0.0.1:3001/api/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      await signIn(data.token, data.user);
      router.replace('/feed');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown} style={styles.stepContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to GiniVibe</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="human1234"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#64748b"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, (!email || !password || loading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!email || !password || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => router.replace('/register')}
          >
            <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchTextHighlight}>Register</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  stepContainer: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 32, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#cbd5e1', marginBottom: 8, fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#818cf8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#94a3b8', fontSize: 14 },
  switchTextHighlight: { color: '#818cf8', fontWeight: 'bold' }
});
