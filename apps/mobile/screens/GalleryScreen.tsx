import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Storage, GalleryEntry } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

function DrawingPreview({ svgData }: { svgData: string }) {
  if (!svgData) return <View style={styles.emptyPreview}><Text style={styles.emptyPreviewText}>✏️</Text></View>;
  return (
    <View style={styles.previewContainer}>
      <SvgXml xml={svgData} width="100%" height="100%" />
    </View>
  );
}

export default function GalleryScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Storage.getGallery().then(g => { setEntries(g); setLoading(false); }); }, []);

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Gallery</Text>
        <Text style={styles.count}>{entries.length} drawings</Text>
      </View>
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🖼️</Text>
          <Text style={styles.emptyTitle}>No drawings yet!</Text>
          <Text style={styles.emptyText}>Complete a drawing to see it here.</Text>
          <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('Play')}>
            <Text style={styles.playBtnText}>Start Drawing ✏️</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries} numColumns={2} keyExtractor={i => i.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <DrawingPreview svgData={item.svgData} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardPrompt} numberOfLines={2}>{item.prompt}</Text>
                {item.aiScore != null && (
                  <Text style={styles.aiScore}>🤖 {item.aiScore}/100 · {item.aiFeedback}</Text>
                )}
                <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0EDE8' },
  backBtn: { fontSize: 16, color: COLORS.primary, fontWeight: '700', paddingRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textLight },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', marginBottom: 24 },
  playBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  playBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  grid: { padding: 8 },
  card: { flex: 1, margin: 4, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2 },
  previewContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#fff' },
  emptyPreview: { width: '100%', aspectRatio: 1, backgroundColor: '#F9F5F0', alignItems: 'center', justifyContent: 'center' },
  emptyPreviewText: { fontSize: 36 },
  cardInfo: { padding: 8 },
  cardPrompt: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  aiScore: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginBottom: 2 },
  cardDate: { fontSize: 11, color: COLORS.textLight },
});
