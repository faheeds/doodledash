import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { FRAMES, getFrame } from '../constants/frames';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FrameShop'>;

export default function FrameShopScreen({ navigation }: Props) {
  const [styleStars, setStyleStars] = useState(0);
  const [ownedFrames, setOwnedFrames] = useState<string[]>(['default']);
  const [activeFrame, setActiveFrame] = useState('default');

  const load = useCallback(async () => {
    const [ss, owned, active] = await Promise.all([
      Storage.getStyleStars(),
      Storage.getOwnedFrames(),
      Storage.getActiveFrame(),
    ]);
    setStyleStars(ss);
    setOwnedFrames(owned);
    setActiveFrame(active);
  }, []);

  useFocusEffect(load);

  const handleEquip = async (frameId: string) => {
    await Storage.setActiveFrame(frameId);
    setActiveFrame(frameId);
  };

  const handleBuy = (frameId: string, cost: number) => {
    const frame = getFrame(frameId);
    Alert.alert(
      `Buy ${frame.emoji} ${frame.name}?`,
      `This costs ⭐ ${cost} Style Stars.\nYou have ⭐ ${styleStars}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy & Equip',
          onPress: async () => {
            const ok = await Storage.spendStyleStars(cost);
            if (!ok) {
              Alert.alert('Not enough ⭐ Style Stars', 'Earn more by winning multiplayer votes!');
              return;
            }
            await Storage.unlockFrame(frameId);
            await Storage.setActiveFrame(frameId);
            setStyleStars(s => s - cost);
            setOwnedFrames(prev => [...prev, frameId]);
            setActiveFrame(frameId);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🖼️ Avatar Frames</Text>
        <View style={styles.starsChip}>
          <Text style={styles.starsText}>⭐ {styleStars}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* How to earn */}
        <View style={styles.earnCard}>
          <Text style={styles.earnTitle}>How to earn ⭐ Style Stars</Text>
          <Text style={styles.earnText}>Win votes in multiplayer games. Each vote you receive earns you ⭐ 1 Style Star.</Text>
        </View>

        {/* Current frame preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>YOUR CURRENT FRAME</Text>
          <FramePreview frameId={activeFrame} size={100} />
          <Text style={styles.previewName}>{getFrame(activeFrame).emoji} {getFrame(activeFrame).name}</Text>
        </View>

        <Text style={styles.sectionLabel}>ALL FRAMES</Text>

        {FRAMES.map((frame) => {
          const owned = ownedFrames.includes(frame.id);
          const isActive = activeFrame === frame.id;

          return (
            <View
              key={frame.id}
              style={[
                styles.frameCard,
                isActive && { borderColor: COLORS.primary, borderWidth: 2 },
              ]}
            >
              <FramePreview frameId={frame.id} size={72} />

              <View style={styles.frameInfo}>
                <Text style={styles.frameName}>{frame.emoji} {frame.name}</Text>
                <Text style={styles.frameDesc}>{frame.description}</Text>
                {frame.cost > 0 && !owned && (
                  <Text style={styles.frameCost}>⭐ {frame.cost} Style Stars</Text>
                )}
                {owned && <Text style={styles.ownedLabel}>✓ Owned</Text>}
              </View>

              <View style={styles.frameActions}>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Equipped</Text>
                  </View>
                ) : owned ? (
                  <TouchableOpacity style={styles.equipBtn} onPress={() => handleEquip(frame.id)}>
                    <Text style={styles.equipBtnText}>Equip</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.buyBtn, styleStars < frame.cost && styles.buyBtnDisabled]}
                    onPress={() => handleBuy(frame.id, frame.cost)}
                  >
                    <Text style={styles.buyBtnText}>⭐ {frame.cost}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable frame ring component — used in profile and cards
export function FramePreview({ frameId, size = 60 }: { frameId: string; size?: number }) {
  const frame = getFrame(frameId);
  const border = Math.max(3, size * 0.07);
  const fontSize = size * 0.4;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: border,
        borderColor: frame.colors[0],
        backgroundColor: frame.colors[1] + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize }}>🎨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  starsChip: { backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  starsText: { fontSize: 14, fontWeight: '800', color: '#C2410C' },

  scroll: { padding: 20, paddingTop: 8, gap: 14 },

  earnCard: {
    backgroundColor: '#FFF7ED', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  earnTitle: { fontSize: 14, fontWeight: '800', color: '#9A3412', marginBottom: 4 },
  earnText: { fontSize: 13, color: '#C2410C', lineHeight: 20 },

  previewSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  previewLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1 },
  previewName: { fontSize: 18, fontWeight: '900', color: COLORS.text },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1 },

  frameCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 14,
    elevation: 1, borderWidth: 1, borderColor: '#E2E8F0',
  },
  frameInfo: { flex: 1, gap: 3 },
  frameName: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  frameDesc: { fontSize: 12, color: COLORS.textLight },
  frameCost: { fontSize: 13, fontWeight: '700', color: '#C2410C', marginTop: 2 },
  ownedLabel: { fontSize: 12, color: '#22C55E', fontWeight: '700', marginTop: 2 },

  frameActions: { alignItems: 'center' },
  activeBadge: {
    backgroundColor: COLORS.primary + '18', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  equipBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  equipBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  buyBtn: {
    backgroundColor: '#F97316', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  buyBtnDisabled: { backgroundColor: '#E2E8F0' },
  buyBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
