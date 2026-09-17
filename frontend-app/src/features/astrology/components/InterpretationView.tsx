import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface InterpretationViewProps {
  interpretation: { markdown: string };
}

export default function InterpretationView({ interpretation }: InterpretationViewProps) {
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <Markdown style={markdownStyles}>
          {interpretation.markdown}
        </Markdown>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  }
});

const markdownStyles = StyleSheet.create({
  body: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heading3: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
  },
  th: {
    padding: 8,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    flex: 1,
  },
  td: {
    padding: 8,
    color: '#cbd5e1',
    flex: 1,
  },
  strong: {
    fontWeight: 'bold',
    color: '#fff',
  },
  em: {
    fontStyle: 'italic',
    color: '#cbd5e1',
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 16,
  }
});
