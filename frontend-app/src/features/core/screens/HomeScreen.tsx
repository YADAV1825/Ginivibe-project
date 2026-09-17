import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert , Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();


//   const performLogout = async () => {
//   try {
//     await Promise.all([
//       AsyncStorage.removeItem('userToken'),
//       AsyncStorage.removeItem('userData'),
//     ]);
//     router.replace('/login'); // Verify your login route path
//   } catch (error) {
//     console.error('Logout error:', error);
//   }
// };

  const handleLogout = async () => {
    const proceed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to log out?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Log Out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Log Out', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });

    if (!proceed) return;

    try {
      const authKeys = [
        'ginivibe_auth_token',
        'ginivibe_auth_user',
        'ginivibe_user_id',
      ];

      // Remove keys from AsyncStorage for mobile (iOS/Android)
      await Promise.all(authKeys.map((key) => AsyncStorage.removeItem(key)));

      // Remove directly from localStorage for web
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        authKeys.forEach((key) => window.localStorage.removeItem(key));
      }

      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  // Basic theming colors based on appearance
  const theme = {
    background: isDark ? '#000000' : '#f0f2f5',
    surface: isDark ? '#1c1c1e' : '#ffffff',
    textPrimary: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#8e8e93' : '#666666',
    accent: '#0a84ff',
    warning: '#ff9f0a',
    success: '#32d74b',
    danger: '#ff453a',
    border: isDark ? '#38383a' : '#e5e5ea',
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 24,
      paddingTop: 60,
    },
    headerContent: {
      flex: 1,
      marginRight: 16,
    },
    logoutButton: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    cardsContainer: {
      paddingHorizontal: 16,
      gap: 16,
      marginBottom: 32,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginLeft: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
    },
    buttonPrimary: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonPrimaryText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSecondary: {
      backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonSecondaryText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    linkText: {
      color: theme.accent,
      fontSize: 16,
      fontWeight: '500',
    },
    emptyStateCard: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 15,
      marginBottom: 20,
      lineHeight: 22,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Welcome back, User 👋</Text>
          <Text style={styles.subtitle}>Here's what's happening in your universe today.</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={22} color={theme.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {/* Daily Matches */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={24} color={theme.accent} />
            <Text style={styles.cardTitle}>Daily Matches</Text>
          </View>
          <Text style={styles.cardDescription}>You have 3 new potential matches waiting</Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.push('/matching')}>
            <Text style={styles.buttonPrimaryText}>View Matches</Text>
          </TouchableOpacity>
        </View>

        {/* Astrology Insight */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={24} color={theme.warning} />
            <Text style={styles.cardTitle}>Astrology Insight</Text>
          </View>
          <Text style={styles.cardDescription}>Jupiter's alignment brings good fortune</Text>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/astrology')}>
            <Text style={styles.buttonSecondaryText}>Read Daily Horoscope</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={theme.success} />
            <Text style={styles.cardTitle}>Upcoming Events</Text>
          </View>
          <Text style={styles.cardDescription}>Speed Matching starts in 2 hours</Text>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/events')}>
            <Text style={styles.buttonSecondaryText}>Join Event</Text>
          </TouchableOpacity>
        </View>

        {/* Community Lounges */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="radio" size={24} color="#a855f7" />
            <Text style={styles.cardTitle}>Community Lounges</Text>
          </View>
          <Text style={styles.cardDescription}>Drop into live Voice, Video, and Text rooms</Text>
          <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: '#8b5cf6' }]} onPress={() => router.push('/rooms' as any)}>
            <Text style={styles.buttonPrimaryText}>Explore Lounges</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/feed')}>
          <Ionicons name="albums-outline" size={16} color={theme.accent} style={{ marginRight: 4 }} />
          <Text style={styles.linkText}>Go to Feed</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.cardsContainer, { marginBottom: 40 }]}>
        <View style={[styles.card, styles.emptyStateCard]}>
          <Text style={styles.emptyStateText}>Your feed is looking a bit quiet. Connect with more people or post an update!</Text>
          <TouchableOpacity style={styles.buttonSecondary}>
            <Text style={styles.buttonSecondaryText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}