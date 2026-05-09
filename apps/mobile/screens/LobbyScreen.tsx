import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { ensureAnonSession, generateRoomCode, getAccessToken } from '../utils/supabase';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

const SUPA_URL = 'https://ukhomzhkppnagttadzkv.supabase.co/rest/v1';
const ANON_KEY = 'sb_publishable_3Epw86dpE1iXWP78-xQONw_7nfgNzVP';

async function rest(path: string, method: string, body?: object, token?: string | null) {
  const res = await fetch(`${SUPA_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, data: text ? JSON.parse(text) : null }; }
  catch { return { ok: false, data: text }; }
}

export default function LobbyScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getOrCreateUser = async (authId: string, username: string, token: string | null) => {
    // Try to find existing user
    const { data: existing } = await rest(`/users?auth_id=eq.${authId}&select=id`, 'GET', undefined, token);
    if (Array.isArray(existing) && existing[0]?.id) return existing[0].id as string;
    // Create new
    const { data: created } = await rest('/users', 'POST', { auth_id: authId, username }, token);
    const row = Array.isArray(created) ? created[0] : created;
    return row?.id as string | null;
  };

  const handleCreate = async () => {
    setLoading(true); setError('');
    try {
      const authId = await ensureAnonSession();
      if (!authId) throw new Error('Could not connect. Check internet.');
      const token = getAccessToken();
      const username = (await Storage.getUsername()) || 'Player';
      const roomCode = generateRoomCode();

      const userId = await getOrCreateUser(authId, username, token);
      if (!userId) throw new Error('Could not create user profile.');

      const { data: matchData } = await rest('/matches', 'POST', {
        room_code: roomCode, status: 'lobby', total_rounds: 5, host_user_id: userId,
      }, token);
      const match = Array.isArray(matchData) ? matchData[0] : matchData;
      if (!match?.id) throw new Error('Could not create room.');

      await rest('/match_players', 'POST', {
        match_id: match.id, user_id: userId, display_name: username, is_ready: false, is_bot: false,
      }, token);

      navigation.replace('WaitingRoom', { matchId: match.id, roomCode: match.room_code, isHost: true, userId, username });
    } catch (e: any) { setError(e.message || 'Something went wrong'); }
    setLoading(false);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setError('Enter the 6-letter room code'); return; }
    setLoading(true); setError('');
    try {
      const authId = await ensureAnonSession();
      if (!authId) throw new Error('Could not connect. Check internet.');
      const token = getAccessToken();
      const username = (await Storage.getUsername()) || 'Player';

      const { data: matches } = await rest(`/matches?room_code=eq.${code}&select=id,room_code,status`, 'GET', undefined, token);
      const match = Array.isArray(matches) ? matches[0] : null;
      if (!match) throw new Error('Room not found. Check the code!');
      if (match.status !== 'lobby') throw new Error('That game already started!');

      const { data: playerList } = await rest(`/match_players?match_id=eq.${match.id}&is_bot=eq.false&select=id`, 'GET', undefined, token);
      if ((playerList?.length ?? 0) >= 8) throw new Error('That room is full!');

      const userId = await getOrCreateUser(authId, username, token);
      if (!userId) throw new Error('Could not create user profile.');

      await rest('/match_players', 'POST', {
        match_id: match.id, user_id: userId, display_name: username, is_ready: false, is_bot: false,
      }, token);

      navigation.replace('WaitingRoom', { matchId: match.id, roomCode: match.room_code, isHost: false, userId, username });
    } catch (e: any) { setError(e.message || 'Something went wrong'); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎮 Multiplayer</Text>
          <Text style={styles.subtitle}>Play with friends in real time!</Text>

          {mode === 'menu' && (
            <View style={styles.menu}>
              <TouchableOpacity style={styles.bigBtn} onPress={() => setMode('create')}>
                <Text style={styles.bigBtnIcon}>🏠</Text>
                <Text style={styles.bigBtnTitle}>Create Game</Text>
                <Text style={styles.bigBtnSub}>Get a room code to share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bigBtn, styles.joinBtn]} onPress={() => setMode('join')}>
                <Text style={styles.bigBtnIcon}>🚪</Text>
                <Text style={styles.bigBtnTitle}>Join Game</Text>
                <Text style={styles.bigBtnSub}>Enter a friend's room code</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'create' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ready to host?</Text>
              <Text style={styles.cardSub}>A room code will be generated for your friends.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} /> : (
                <TouchableOpacity style={styles.actionBtn} onPress={handleCreate}>
                  <Text style={styles.actionBtnText}>Create Room ✨</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { setMode('menu'); setError(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'join' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Enter Room Code</Text>
              <TextInput
                style={styles.codeInput} value={joinCode}
                onChangeText={t => setJoinCode(t.toUpperCase())}
                placeholder="ABC123" placeholderTextColor="#ccc"
                maxLength={6} autoCapitalize="characters" autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} /> : (
                <TouchableOpacity style={styles.actionBtn} onPress={handleJoin}>
                  <Text style={styles.actionBtnText}>Join Room →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { setMode('menu'); setJoinCode(''); setError(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20 },
  back: { marginBottom: 8 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginTop: 12 },
  subtitle: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 32 },
  menu: { gap: 16 },
  bigBtn: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 3 },
  joinBtn: { backgroundColor: '#7C3AED' },
  bigBtnIcon: { fontSize: 36, marginBottom: 8 },
  bigBtnTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  bigBtnSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 2, alignItems: 'center' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  cardSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 24 },
  codeInput: { borderWidth: 3, borderColor: COLORS.primary, borderRadius: 16, fontSize: 32, fontWeight: '900', color: COLORS.text, textAlign: 'center', padding: 16, letterSpacing: 8, width: '100%', marginBottom: 16 },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  actionBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cancelText: { marginTop: 16, color: COLORS.textLight, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 14, marginBottom: 8, textAlign: 'center' },
});
