import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AnimatedBackground from '../../../components/AnimatedBackground';
import AnimatedPressable from '../../../components/AnimatedPressable';
import NorthIndianChart from '../components/NorthIndianChart';
import InterpretationView from '../components/InterpretationView';
import LocationPicker from '../components/LocationPicker';
import { AstrologyApi } from '../api/api';
import { NativeAdBanner } from '../../ads';

export default function AstrologyScreen() {
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    timezone: 'Asia/Kolkata', // Default
    latitude: 0,
    longitude: 0,
    countryCode: '',
    stateCode: '',
    city: ''
  });

  const [dateDay, setDateDay] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateYear, setDateYear] = useState('');

  const [timeHour, setTimeHour] = useState('');
  const [timeMinute, setTimeMinute] = useState('');
  const [timeAmPm, setTimeAmPm] = useState('AM');

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interpreting, setInterpreting] = useState(false);

  const [chartData, setChartData] = useState<any>(null);
  const [interpretation, setInterpretation] = useState<any>(null);

  const [limitReached, setLimitReached] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const cached = await AsyncStorage.getItem('@astrology_history');
        if (cached) {
          const parsedHistory = JSON.parse(cached);
          setHistory(parsedHistory);
          if (parsedHistory.length > 0) {
            loadHistoryItem(parsedHistory[0]);
          }
        }
        await checkLimit();
      } catch (e) {
        console.error('Failed to load history', e);
      }
    };
    loadState();
  }, []);

  const loadHistoryItem = (item: any) => {
    setFormData(item.formData);
    setDateDay(item.dateDay);
    setDateMonth(item.dateMonth);
    setDateYear(item.dateYear);
    setTimeHour(item.timeHour);
    setTimeMinute(item.timeMinute);
    setTimeAmPm(item.timeAmPm);
    setChartData(item.chartData);
    setInterpretation(item.interpretation);
  };

  const checkLimit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const limitsStr = await AsyncStorage.getItem('@astrology_limits');
      const limits = limitsStr ? JSON.parse(limitsStr) : {};
      if (limits.date === today && limits.count >= 5) {
        setLimitReached(true);
        return false;
      }
      return true;
    } catch (e) {
      return true;
    }
  };

  const incrementLimit = async () => {
    const today = new Date().toISOString().split('T')[0];
    const limitsStr = await AsyncStorage.getItem('@astrology_limits');
    const limits = limitsStr ? JSON.parse(limitsStr) : {};
    const newCount = limits.date === today ? (limits.count || 0) + 1 : 1;
    await AsyncStorage.setItem('@astrology_limits', JSON.stringify({ date: today, count: newCount }));
    if (newCount >= 5) setLimitReached(true);
  };

  const saveState = async (cData: any, interp: any, payload: any) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      formData: payload,
      dateDay, dateMonth, dateYear, timeHour, timeMinute, timeAmPm,
      chartData: cData,
      interpretation: interp
    };
    
    setHistory(prev => {
      const filtered = prev.filter(item => 
        !(item.formData.name === payload.name && item.formData.date === payload.date && item.formData.time === payload.time && item.formData.city === payload.city)
      );
      const newHistory = [newItem, ...filtered].slice(0, 20);
      AsyncStorage.setItem('@astrology_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleGenerate = async () => {
    if (!formData.name || !dateDay || !dateMonth || !dateYear || !timeHour || !timeMinute || !formData.city) return;

    const canGenerate = await checkLimit();
    if (!canGenerate) {
      Alert.alert('Limit Reached', 'You have reached your daily limit of 5 charts.');
      return;
    }

    setLoading(true);
    setInterpreting(false);
    try {
      const year = dateYear.padStart(4, '0');
      const month = dateMonth.padStart(2, '0');
      const day = dateDay.padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let hr = parseInt(timeHour || '0');
      if (timeAmPm === 'PM' && hr < 12) hr += 12;
      if (timeAmPm === 'AM' && hr === 12) hr = 0;
      const hrStr = hr.toString().padStart(2, '0');
      const minStr = (timeMinute || '0').padStart(2, '0');
      const timeStr = `${hrStr}:${minStr}:00`;

      const payload = {
        ...formData,
        date: dateStr,
        time: timeStr
      };

      const data = await AstrologyApi.generateChart(payload);
      setChartData(data);
      setInterpretation(null);

      await incrementLimit();
      await saveState(data, null, payload);

      // Auto-fetch interpretation
      await fetchInterpretation(payload, data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterpretation = async (payload: any, cData: any) => {
    setInterpreting(true);
    try {
      const result = await AstrologyApi.getInterpretation(payload);
      setInterpretation(result);
      await saveState(cData, result, payload);
    } catch (e) {
      console.error(e);
    } finally {
      setInterpreting(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <Animated.Text entering={FadeInDown.delay(100).springify()} style={styles.header}>
          Vedic Astrology
        </Animated.Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {history.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: 16 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>Recent Charts</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {history.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                    onPress={() => loadHistoryItem(item)}
                  >
                    <Text style={{ color: '#fff', fontSize: 14 }}>{item.formData.name || 'Unknown'} - {item.formData.city || 'Unknown'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <BlurView intensity={20} tint="dark" style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#64748b"
                  value={formData.name}
                  onChangeText={val => setFormData({ ...formData, name: val })}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex1, styles.smallPadding, { textAlign: 'center' }]}
                    placeholder="DD"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={dateDay}
                    onChangeText={val => setDateDay(val.replace(/[^0-9]/g, '').slice(0, 2))}
                  />
                  <TextInput
                    style={[styles.input, styles.flex1, styles.smallPadding, { textAlign: 'center', marginHorizontal: 8 }]}
                    placeholder="MM"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={dateMonth}
                    onChangeText={val => setDateMonth(val.replace(/[^0-9]/g, '').slice(0, 2))}
                  />
                  <TextInput
                    style={[styles.input, styles.flex1, styles.smallPadding, { textAlign: 'center' }]}
                    placeholder="YYYY"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={dateYear}
                    onChangeText={val => setDateYear(val.replace(/[^0-9]/g, '').slice(0, 4))}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Time of Birth</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.flex1, styles.smallPadding, { textAlign: 'center' }]}
                    placeholder="HH"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={timeHour}
                    onChangeText={val => setTimeHour(val.replace(/[^0-9]/g, '').slice(0, 2))}
                  />
                  <TextInput
                    style={[styles.input, styles.flex1, styles.smallPadding, { textAlign: 'center', marginHorizontal: 8 }]}
                    placeholder="MM"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={timeMinute}
                    onChangeText={val => setTimeMinute(val.replace(/[^0-9]/g, '').slice(0, 2))}
                  />
                  <TouchableOpacity
                    style={[styles.inputWrapper, styles.flex1, styles.smallPadding, { justifyContent: 'center' }]}
                    onPress={() => setTimeAmPm(timeAmPm === 'AM' ? 'PM' : 'AM')}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{timeAmPm}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Location</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Ionicons name="location-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 16 }}>
                    <Text style={{ color: formData.city ? '#fff' : '#64748b', fontSize: 14 }} numberOfLines={1}>
                      {formData.city || 'Search City...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <AnimatedPressable scaleTo={0.95} onPress={handleGenerate} disabled={loading || limitReached}>
                <LinearGradient colors={limitReached ? ['#64748b', '#475569'] : ['#818cf8', '#c084fc']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.buttonText}>{limitReached ? 'Daily Limit Reached (5/5)' : 'Generate Chart'}</Text>
                      {!limitReached && <Ionicons name="sparkles" size={18} color="#fff" />}
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </BlurView>
          </Animated.View>

          {chartData && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginTop: 24 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
                <NorthIndianChart data={chartData.d1} title="Lagna Chart (D1)" />
                <NorthIndianChart data={chartData.d9} title="Navamsa Chart (D9)" />
              </ScrollView>
            </Animated.View>
          )}

          {interpreting && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 32, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#c084fc" />
              <Text style={{ color: '#94a3b8', marginTop: 16 }}>Analyzing your charts...</Text>
            </Animated.View>
          )}

          {interpretation && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 32 }}>
              <InterpretationView interpretation={interpretation} />
            </Animated.View>
          )}

          {/* In-House Sponsored Placement */}
          <NativeAdBanner placement="EXPLORE" containerStyle={{ marginTop: 28, marginBottom: 20 }} />

        </ScrollView>
      </View>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(loc) => setFormData({ ...formData, ...loc })}
      />
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  formContainer: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  flex2: {
    flex: 2,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    padding: 16,
    fontSize: 16,
  },
  smallPadding: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
