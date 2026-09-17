import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const ICONS: Record<string, any> = {
  home: 'home-outline',
  feed: 'list-outline',
  rooms: 'radio-outline',
  events: 'calendar-outline',
  astrology: 'planet-outline',
  matching: 'heart-outline',
  messages: 'chatbubbles-outline',
  gini_ai: 'sparkles-outline',
};

function TabBarIcon({ name, isFocused }: { name: any; isFocused: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.2, { damping: 10, stiffness: 300 }, () => {
        scale.value = withSpring(1.1, { damping: 10 });
      });
    } else {
      scale.value = withSpring(1, { damping: 12 });
    }
  }, [isFocused]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={22} color={isFocused ? '#c084fc' : '#64748b'} />
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const routeCount = Math.max(state.routes.length, 1);
  const tabWidth = width / routeCount;
  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    indicatorPosition.value = withSpring(state.index * tabWidth, {
      damping: 15,
      stiffness: 200,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  return (
    <View style={styles.tabBarContainer}>
      <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />

      <Animated.View
        style={[styles.indicatorWrapper, { width: tabWidth }, indicatorStyle]}
      >
        <View style={styles.indicatorPill} />
      </Animated.View>

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = ICONS[route.name] || 'home-outline';

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.tabItem}
          >
            <TabBarIcon name={iconName} isFocused={isFocused} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
              {options.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="rooms" options={{ title: 'Rooms' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="astrology" options={{ title: 'Astrology' }} />
      <Tabs.Screen name="matching" options={{ title: 'Match' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen
        name="gini_ai"
        options={{
          title: 'Gini AI',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: Platform.OS === 'ios' ? 85 : 75,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    backgroundColor:
      Platform.OS === 'ios' ? 'transparent' : 'rgba(15, 23, 42, 0.85)',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#c084fc',
    fontWeight: '700',
  },
  indicatorWrapper: {
    position: 'absolute',
    top: -2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  indicatorPill: {
    width: 24,
    height: 4,
    backgroundColor: '#c084fc',
    borderRadius: 2,
    shadowColor: '#c084fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
