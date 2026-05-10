import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Storage } from '../utils/storage';
import { generateUsername } from '../utils/username';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Tutorial'>;

const INFO_STEPS = [
  { emoji: '✏️', title: "Hi! I'm Pip the Pencil!", body: "Welcome to Doodle Dash — the drawing game where personality beats skill!", cta: "Let's go!" },
  { emoji: '🎯', title: "You get a prompt", body: "Every round, everyone gets the SAME drawing prompt. You have 60 seconds to draw it YOUR way.", cta: "Got it!" },
  { emoji: '🎨', title: "Draw your heart out", body: "Use brushes, colors, eraser, and bucket fill. Each round you get ONE magic stamp ✨ — use it wisely!", cta: "Cool!" },
  { emoji: '⭐', title: "Vote for your faves", body: "After everyone draws, vote for Most Creative, Funniest, and Best Match. The AI judge scores everyone too!", cta: "Sounds fun!" },
  { emoji: '🏆', title: "Skill doesn't matter", body: "The worst drawing can still WIN if it's funny or creative. That's the whole point!", cta: "Let's play!" },
];

export default function TutorialScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [parentEmail, setParentEmail] = useState('');
  const isEmailStep = step === INFO_STEPS.length;
  const totalSteps = INFO_STEPS.length + 1; // +1 for email step

  const finish = async (email?: string) => {
    const uname = generateUsername();
    await Storage.setUsername(uname);
    await Storage.setTutorialDone();
    if (email?.trim()) await Storage.setParentEmail(email.trim());
    navigation.replace('Home');
  };

  if (isEmailStep) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.skipBtn} onPress={() => finish()}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.pip}>👨‍👩‍👧</Text>
              <Text style={styles.title}>Safety First!</Text>
              <Text style={styles.body}>
                Doodle Dash is designed for ages 8–13.{'\n\n'}
                Add a parent or guardian's email so we can contact them if anything important comes up.
                This is totally optional!
              </Text>
              <TextInput
                style={styles.emailInput}
                value={parentEmail}
                onChangeText={setParentEmail}
                placeholder="parent@example.com"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.policyLink}
                onPress={() => navigation.navigate('Policy')}
              >
                <Text style={styles.policyLinkText}>Read our Privacy Policy & Terms →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
              ))}
            </View>

            <TouchableOpacity style={styles.ctaBtn} onPress={() => finish(parentEmail)}>
              <Text style={styles.ctaText}>Start Drawing! 🎨</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const current = INFO_STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => finish()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.pip}>{current.emoji}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => setStep(s => s + 1)}>
          <Text style={styles.ctaText}>{current.cta} →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'space-between' },
  skipBtn: { alignSelf: 'flex-end', padding: 8, minHeight: 32 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%' },
  pip: { fontSize: 100 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center' },
  body: { fontSize: 17, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 26, maxWidth: 300 },
  emailInput: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 20, paddingVertical: 14,
    fontSize: 16, color: '#fff', width: '100%', textAlign: 'center',
  },
  policyLink: { marginTop: 4 },
  policyLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecorationLine: 'underline' },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff', width: 24 },
  ctaBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 40, paddingVertical: 16, width: '100%', alignItems: 'center' },
  ctaText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
});
