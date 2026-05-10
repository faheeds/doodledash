import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';
import { FramePreview } from './FrameShopScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [sparks, setSparks] = useState(0);
  const [styleStars, setStyleStars] = useState(0);
  const [activeFrame, setActiveFrame] = useState('default');
  const [dailyDone, setDailyDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    const done = await Storage.isTutorialDone();
    if (!done) { navigation.replace('Tutorial'); return; }
    const today = new Date().toISOString().slice(0, 10);
    const [name, sp, ss, frame, dailyDate] = await Promise.all([
      Storage.getUsername(),
      Storage.getSparks(),
      Storage.getStyleStars(),
      Storage.getActiveFrame(),
      Storage.getDailyDoodleDate(),
    ]);
    setUsername(name);
    setSparks(sp);
    setStyleStars(ss);
    setActiveFrame(frame);
    setDailyDone(dailyDate === today);
    setLoading(false);
  }, []);

  useFocusEffect(init);

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('FrameShop')} style={styles.avatarBtn}>
            <FramePreview frameId={activeFrame} size={48} />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.logo}>🎨 Doodle Dash</Text>
            <Text style={styles.greeting}>Hey, {username}!</Text>
          </View>
          <View style={styles.currencyCol}>
            <View style={styles.sparksChip}>
              <Text style={styles.sparksText}>⚡ {sparks}</Text>
            </View>
            <View style={styles.starsChip}>
              <Text style={styles.starsText}>⭐ {styleStars}</Text>
            </View>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✏️</Text>
          <Text style={styles.heroTitle}>Ready to draw?</Text>
          <Text style={styles.heroSub}>Get a prompt, draw it in 60 seconds,{'\n'}let the world judge your masterpiece.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('Sketchbook')}>
            <Text style={styles.playBtnText}>📓 Sketchbooks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.multiBtn} onPress={() => navigation.navigate('Lobby')}>
            <Text style={styles.multiBtnText}>🎮 Play with Friends</Text>
          </TouchableOpacity>
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('DailyDoodle')}>
              <Text style={styles.secondaryIcon}>📅</Text>
              <Text style={styles.secondaryLabel}>Daily Doodle</Text>
              {dailyDone && <Text style={styles.doneDot}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Gallery')}>
              <Text style={styles.secondaryIcon}>🖼️</Text>
              <Text style={styles.secondaryLabel}>My Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('FrameShop')}>
              <Text style={styles.secondaryIcon}>🖼️</Text>
              <Text style={styles.secondaryLabel}>Frames</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.sketchbook} onPress={() => navigation.navigate('Sketchbook')}>
          <View style={styles.sketchbookRow}>
            <Text style={styles.sketchbookTitle}>📓 Sketchbook Progress</Text>
            <Text style={styles.sketchbookChevron}>›</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((sparks / 150) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{sparks} / 150 ⚡ to unlock Animal Antics</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  avatarBtn: { /* tappable avatar ring */ },
  headerMid: { flex: 1 },
  logo: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  greeting: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  currencyCol: { gap: 4, alignItems: 'flex-end' },
  sparksChip: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sparksText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  starsChip: { backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  starsText: { fontSize: 12, fontWeight: '800', color: '#C2410C' },
  hero: { alignItems: 'center', marginBottom: 32 },
  heroEmoji: { fontSize: 72, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  heroSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  actions: { gap: 12, marginBottom: 24 },
  playBtn: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, alignItems: 'center' },
  playBtnText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  multiBtn: { backgroundColor: '#7C3AED', borderRadius: 20, padding: 20, alignItems: 'center' },
  multiBtnText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  secondaryBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, elevation: 1 },
  secondaryIcon: { fontSize: 28 },
  secondaryLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  comingSoon: { fontSize: 9, color: COLORS.primary, fontWeight: '700' },
  doneDot: { fontSize: 10, color: '#22C55E', fontWeight: '900' },
  sketchbook: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
  sketchbookRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sketchbookTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.text },
  sketchbookChevron: { fontSize: 22, color: COLORS.primary, fontWeight: '900' },
  progressBar: { height: 8, backgroundColor: '#F0EDE8', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: COLORS.textLight },
});
