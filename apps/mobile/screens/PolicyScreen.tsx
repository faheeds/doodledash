import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Policy'>;

const PRIVACY = `Last updated: May 2026

WHAT WE COLLECT
Doodle Dash collects:
• An anonymous user ID (no name, email, or login required to play)
• Your drawings and scores, stored temporarily for game play
• Optional parent email, used only to send safety alerts

We do NOT collect real names, phone numbers, addresses, or payment info.

HOW WE USE DATA
• To run the game — match you with other players, show leaderboards
• To keep the game safe — detect inappropriate content and enforce cool-down periods
• To contact parents if a safety concern is flagged (only if parent email is provided)

DATA SHARING
We do not sell data. We use Supabase (supabase.com) to store game data securely. Drawings are deleted 30 days after a game ends.

CHILDREN'S PRIVACY
Doodle Dash is designed for ages 8–13. We collect minimal data and never show ads. Parents can email privacy@doodledash.app to request data deletion.

YOUR RIGHTS
• Request a copy of your data: privacy@doodledash.app
• Delete your account: privacy@doodledash.app
• Opt-out of leaderboards: turn off in Settings (coming soon)`;

const TERMS = `Last updated: May 2026

BY PLAYING DOODLE DASH, YOU AGREE TO THESE TERMS.

ACCEPTABLE USE
You agree to:
• Keep drawings fun, creative, and appropriate for all ages
• Not draw violent, hateful, or inappropriate content
• Treat other players with kindness

CONSEQUENCES
Drawing inappropriate content may result in:
• A warning (Strike 1 or 2)
• A 30-minute cool-down period (Strike 3)
• Permanent ban for repeat offenders

CONTENT OWNERSHIP
You keep ownership of your drawings. By playing, you give Doodle Dash permission to display your drawings to other players during the game.

DISCLAIMER
Doodle Dash is provided as-is. We are not responsible for content created by other players. If you see something inappropriate, use the 🚩 report button.

CONTACT
Questions? Email hello@doodledash.app`;

export default function PolicyScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'privacy' && styles.tabActive]}
          onPress={() => setTab('privacy')}
        >
          <Text style={[styles.tabText, tab === 'privacy' && styles.tabTextActive]}>
            🔒 Privacy Policy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'terms' && styles.tabActive]}
          onPress={() => setTab('terms')}
        >
          <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>
            📋 Terms of Use
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>{tab === 'privacy' ? PRIVACY : TERMS}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
  },
  backBtn: { paddingRight: 8 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.text },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary },

  content: { padding: 20 },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
});
