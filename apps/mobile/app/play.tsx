import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { getRandomPrompt, getDailyPrompt } from '../constants/prompts';
import { COLORS } from '../constants/colors';

export default function PlayScreen() {
  const [prompt, setPrompt] = useState(getRandomPrompt());
  const [shake] = useState(new Animated.Value(0));

  const shufflePrompt = useCallback(() => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    setPrompt(getRandomPrompt());
  }, [shake]);

  const startDrawing = useCallback(() => {
    router.push({ pathname: '/draw', params: { prompt } });
  }, [prompt]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your Prompt</Text>
        <Text style={styles.subtitle}>You have 60 seconds to draw this!</Text>

        <Animated.View style={[styles.promptCard, { transform: [{ translateX: shake }] }]}>
          <Text style={styles.promptEmoji}>🎯</Text>
          <Text style={styles.promptText}>{prompt}</Text>
        </Animated.View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shuffleBtn} onPress={shufflePrompt}>
            <Text style={styles.shuffleBtnText}>🔀 Different Prompt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startBtn} onPress={startDrawing}>
            <Text style={styles.startBtnText}>Start Drawing! ✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Remember:</Text>
          <Text style={styles.rulesText}>• Personality beats skill</Text>
          <Text style={styles.rulesText}>• 60 seconds on the clock</Text>
          <Text style={styles.rulesText}>• Use your magic stamp wisely ✨</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.textLight, marginBottom: 32 },
  promptCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32,
    alignItems: 'center', marginBottom: 32, elevation: 3,
    borderWidth: 2, borderColor: '#F97316',
  },
  promptEmoji: { fontSize: 40, marginBottom: 12 },
  promptText: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  actions: { gap: 12, marginBottom: 32 },
  shuffleBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary,
  },
  shuffleBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  startBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center' },
  startBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  rulesBox: { backgroundColor: '#FEF9EE', borderRadius: 12, padding: 16, gap: 6 },
  rulesTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  rulesText: { fontSize: 13, color: COLORS.textLight },
});
