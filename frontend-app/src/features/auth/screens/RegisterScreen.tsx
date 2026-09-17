import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
const API_URL = 'http://localhost:3001/api/auth';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Technology: 'hardware-chip-outline',
  Finance: 'trending-up-outline',
  Sports: 'trophy-outline',
  Entertainment: 'film-outline',
  Gaming: 'game-controller-outline',
  Wellness: 'fitness-outline',
  Art: 'color-palette-outline',
  Career: 'briefcase-outline',
  Food: 'restaurant-outline',
  News: 'newspaper-outline',
  Travel: 'airplane-outline',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  // Step 2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Steps 3 & 4
  const [allInterests, setAllInterests] = useState<any[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/interests`)
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(setAllInterests)
      .catch(err => {
        console.warn("Using fallback interests due to fetch error:", err);
        setAllInterests([
          { id: '1', name: 'Technology', subInterests: [{ id: '101', name: 'AI & Machine Learning' }, { id: '102', name: 'Software Development' }] },
          { id: '2', name: 'Gaming', subInterests: [{ id: '201', name: 'PC Gaming' }, { id: '202', name: 'Console Gaming' }] }
        ]);
      });
  }, []);

  useEffect(() => {
    if (username.length === 0) {
      setUsernameValid(null);
      setUsernameMessage('');
      return;
    }

    if (username.length < 8) {
      setUsernameValid(false);
      setUsernameMessage('Minimum 8 characters');
      return;
    }

    setUsernameValid(null);
    setUsernameMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/check-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        const data = await res.json();
        setUsernameValid(data.valid);
        setUsernameMessage(data.message);
      } catch {
        setUsernameValid(false);
        setUsernameMessage('Error checking username');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, email, password,
          firstName, lastName, dob, gender,
          interests: selectedSubIds
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      await signIn(data.token, data.user);
      router.replace('/feed');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubInterest = (id: string) => {
    setSelectedSubIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {step === 1 && (
          <Animated.View entering={FadeInDown} style={styles.stepContainer}>
            <Text style={styles.title}>Join GiniVibe</Text>
            <Text style={styles.subtitle}>Create your credentials</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, usernameValid === false && styles.inputError]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {username.length > 0 && (
                <Text style={usernameValid ? styles.successText : styles.errorText}>
                  {usernameMessage}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, (!usernameValid || !email || !password) && styles.buttonDisabled]}
              onPress={() => setStep(2)}
              disabled={!usernameValid || !email || !password}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextHighlight}>Login</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInDown} style={styles.stepContainer}>
            <Text style={styles.title}>About You</Text>
            <Text style={styles.subtitle}>Let's get to know you better</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="1995-05-20" placeholderTextColor="#64748b" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map(g => (
                  <TouchableOpacity 
                    key={g} 
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setStep(1)}>
                <Text style={styles.buttonOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { flex: 1 }, (!firstName || !dob || !gender) && styles.buttonDisabled]} 
                onPress={() => setStep(3)}
                disabled={!firstName || !dob || !gender}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInDown} style={styles.stepContainer}>
            <Text style={styles.title}>Choose your interests</Text>
            <Text style={styles.subtitle}>Select a major category to explore</Text>
            
            <View style={styles.grid}>
              {allInterests.map(interest => {
                const isSelected = selectedMajorId === interest.id;
                const iconName = ICON_MAP[interest.name] || 'star-outline';
                return (
                  <TouchableOpacity 
                    key={interest.id}
                    style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                    onPress={() => setSelectedMajorId(interest.id)}
                  >
                    <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                      <Ionicons name={iconName} size={24} color={isSelected ? '#fff' : '#94a3b8'} />
                    </View>
                    <Text style={[styles.gridLabel, isSelected && styles.gridLabelSelected]}>{interest.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setStep(2)}>
                <Text style={styles.buttonOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { flex: 1 }, !selectedMajorId && styles.buttonDisabled]} 
                onPress={() => setStep(4)}
                disabled={!selectedMajorId}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInDown} style={styles.stepContainer}>
            <Text style={styles.title}>Customize your feed</Text>
            <Text style={styles.subtitle}>Every selection improves your feed.</Text>
            
            <View style={styles.pillContainer}>
              {allInterests.find(i => i.id === selectedMajorId)?.subInterests.map((sub: any) => {
                const isSelected = selectedSubIds.includes(sub.id);
                return (
                  <TouchableOpacity 
                    key={sub.id}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleSubInterest(sub.id)}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#0f172a" style={{ marginRight: 4 }} />}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{sub.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setStep(3)}>
                <Text style={styles.buttonOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { flex: 1 }, (loading || selectedSubIds.length === 0) && styles.buttonDisabled]} 
                onPress={handleRegister}
                disabled={loading || selectedSubIds.length === 0}
              >
                <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Finish'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  successText: { color: '#10b981', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#818cf8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flex: 0.5,
    marginRight: 12,
  },
  buttonOutlineText: { color: '#cbd5e1', fontSize: 16, fontWeight: '600' },
  actionRow: { flexDirection: 'row', marginTop: 24 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: 'rgba(129, 140, 248, 0.2)', borderColor: '#818cf8' },
  genderBtnText: { color: '#94a3b8' },
  genderBtnTextActive: { color: '#818cf8', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridItemSelected: { backgroundColor: 'rgba(129, 140, 248, 0.2)', borderColor: '#818cf8' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleSelected: { backgroundColor: '#818cf8' },
  gridLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  gridLabelSelected: { color: '#f8fafc' },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pill: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  pillSelected: { backgroundColor: '#f8fafc', borderColor: '#f8fafc' },
  pillText: { color: '#cbd5e1', fontSize: 14 },
  pillTextSelected: { color: '#0f172a', fontWeight: '600' },
  switchButton: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#94a3b8', fontSize: 14 },
  switchTextHighlight: { color: '#818cf8', fontWeight: 'bold' }
});
