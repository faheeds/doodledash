import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [sparks, setSparks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const done = await Storage.isTutorialDone();
      if (!done) { navigation.replace('Tutorial'); return; }
      const [name, sp] = await Promise.all([Storage.getUsername(), Storage.getSparks()]);
      setUsername(name);
      setSparks(sp);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Doodle Dash</Text>
            <Text style={styles.greeting}>Hey, {username}!</Text>
          </View>
          <View style={styles.sparksChip}>
            <Text style={styles.sparksText}>{sparks}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✏️</Text>
          <Text style={styles.heroTitle}>Ready to draw?</Text>
          <Text style={styles.heroSub}>Get a prompt, draw it in 60 seconds,{'\n'}let the AI judge your masterpiece.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('Play')}>
            <Text style={styles.playBtnText}>Solo Practice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.multiBtn} onPress={() => navigation.navigate('Lobby')}>
            <Text style={styles.multiBtnText}>Play with Friends</Text>
          </TouchableOpacity>
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Gallery')}>
              <Text style={styles.secondaryIcon}>🖼️</Text>
              <Text style={styles.secondaryLabel}>My Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Tutorial')}>
              <Text style={styles.secondaryIcon}>📖</Text>
              <Text style={styles.secondaryLabel}>How to Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryIcon}>🏆</Text>
              <Text style={styles.secondaryLabel}>Leaderboard</Text>
              <Text style={styles.comingSoon}>Soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sketchbook}>
          <Text style={styles.sketchbookTitle}>Sketchbook 1: First Day Doodles</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((sparks / 500) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{sparks} / 500 Sparks to unlock Sketchbook 2</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logo: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  greeting: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  sparksChip: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  sparksText: { fontSize: 14, fontWeight: '800', color: '#92400E' },
  hero: { alignItems: 'center', marginBottom: 28 },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  heroSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  actions: { gap: 12, marginBottom: 24 },
  playBtn: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 18, alignItems: 'center' },
  playBtnText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  multiBtn: { backgroundColor: '#7C3AED', borderRadius: 20, padding: 18, alignItems: 'center' },
  multiBtnText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  secondaryBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, elevation: 1 },
  secondaryIcon: { fontSize: 28 },
  secondaryLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  comingSoon: { fontSize: 9, color: COLORS.primary, fontWeight: '700' },
  sketchbook: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
  sketchbookTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  progressBar: { height: 8, backgroundColor: '#F0EDE8', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: COLORS.textLight },
});
