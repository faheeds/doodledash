import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Share, Alert, BackHandler,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase, subscribeToMatch, subscribeToPlayers } from '../utils/supabase';
import { COLORS } from '../constants/colors';
import { PROMPTS } from '../constants/prompts';

type Props = NativeStackScreenProps<RootStackParamList, 'WaitingRoom'>;
type Player = { user_id: string | null; display_name: string; is_ready: boolean; is_bot: boolean };

const BOT_NAMES = ['RobotDoodle9','CrazyBrush7','PixelPanda3','DoodleBot42',
                   'SketchBot5','ArtBot99','QuickDraw7','DrawMaster3'];

export default function WaitingRoomScreen({ navigation, route }: Props) {
  const { matchId, roomCode, isHost, userId, username } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [shared, setShared] = useState(false);
  const unsubMatch = useRef<(() => void) | null>(null);
  const unsubPlayers = useRef<(() => void) | null>(null);

  const loadPlayers = async () => {
    const { data } = await supabase.from('match_players').select('user_id,display_name,is_ready,is_bot', { eq: ['match_id', matchId] });
    if (data) setPlayers(data as Player[]);
  };

  const leaveGame = () => {
    Alert.alert(
      'Leave Game?',
      isHost ? 'Leaving will cancel the room for everyone.' : 'Are you sure you want to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: async () => {
            unsubMatch.current?.();
            unsubPlayers.current?.();
            // Remove this player from the room
            try {
              await supabase.from('match_players').delete().match({ match_id: matchId, user_id: userId });
            } catch {}
            // If host, cancel the match entirely so other players get booted
            if (isHost) {
              try {
                await supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId);
              } catch {}
            }
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadPlayers();
    unsubMatch.current = subscribeToMatch(matchId, (payload) => {
      const match = payload.new as any;
      if (match.status === 'drawing') {
        navigation.replace('MultiDraw', { matchId, roomCode, userId, username, prompt: match.current_prompt, round: match.current_round, totalRounds: match.total_rounds, isHost });
      }
      if (match.status === 'cancelled') {
        Alert.alert('Room Closed', 'The host has left the game.', [{ text: 'OK' }]);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    });
    unsubPlayers.current = subscribeToPlayers(matchId, loadPlayers);

    // Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      leaveGame();
      return true; // prevent default back
    });
    return () => { unsubMatch.current?.(); unsubPlayers.current?.(); backHandler.remove(); };
  }, []);

  const toggleReady = async () => {
    const next = !isReady;
    setIsReady(next);
    // Update only this player's ready state using match on both match_id and user_id
    await supabase.from('match_players').update({ is_ready: next }).match({ match_id: matchId, user_id: userId });
  };

  const addBot = async () => {
    if (players.length >= 8) return;
    const usedNames = players.map(p => p.display_name);
    const botName = BOT_NAMES.find(n => !usedNames.includes(n)) || `Bot${players.length}`;
    await supabase.from('match_players').insert({ match_id: matchId, user_id: null, display_name: botName, is_bot: true, is_ready: true });
    loadPlayers();
  };

  const handleStart = async () => {
    if (players.length < 2) return;
    setStarting(true);
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    await supabase.from('matches').update({ status: 'drawing', current_round: 1, current_prompt: prompt, total_rounds: 5 }).eq('id', matchId);
  };

  const shareCode = async () => {
    try {
      await Share.share({ message: `Join my Doodle Dash game! Room code: ${roomCode}` });
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const allReady = players.length >= 2 && players.filter(p => !p.is_bot).every(p => p.is_ready);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Waiting Room</Text>
          <TouchableOpacity style={styles.leaveBtn} onPress={leaveGame}>
            <Text style={styles.leaveBtnText}>✕ Leave</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={shareCode}>
            <Text style={styles.copyText}>{shared ? '✅ Shared!' : '📤 Share Code'}</Text>
          </TouchableOpacity>
          <Text style={styles.codeSub}>Share this with friends!</Text>
        </View>

        <Text style={styles.sectionLabel}>Players ({players.length}/8)</Text>
        <ScrollView style={styles.playerList}>
          {players.map((p, i) => (
            <View key={p.user_id || i} style={styles.playerRow}>
              <Text style={styles.playerEmoji}>{p.is_bot ? '🤖' : '🎨'}</Text>
              <Text style={styles.playerName}>{p.display_name}{p.user_id === userId ? ' (you)' : ''}</Text>
              <View style={[styles.readyBadge, { backgroundColor: p.is_ready ? '#22C55E' : '#E5E7EB' }]}>
                <Text style={[styles.readyText, { color: p.is_ready ? '#fff' : '#9CA3AF' }]}>
                  {p.is_ready ? '✓ Ready' : 'Waiting'}
                </Text>
              </View>
            </View>
          ))}
          {players.length < 4 && <Text style={styles.botHint}>Need 4 players — add bots to fill!</Text>}
        </ScrollView>

        <View style={styles.actions}>
          {!isHost && (
            <TouchableOpacity style={[styles.readyBtn, isReady && styles.readyBtnActive]} onPress={toggleReady}>
              <Text style={styles.readyBtnText}>{isReady ? '✅ Ready!' : 'Mark Ready'}</Text>
            </TouchableOpacity>
          )}
          {isHost && (
            <>
              <TouchableOpacity style={styles.botBtn} onPress={addBot}>
                <Text style={styles.botBtnText}>+ Add Bot 🤖</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.startBtn, !allReady && players.length >= 2 && styles.startBtnWarning]} onPress={handleStart} disabled={starting || players.length < 2}>
                {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>{allReady ? '🚀 Start Game!' : players.length >= 2 ? '▶ Start Anyway' : 'Need 2+ players'}</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  screenTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: COLORS.text },
  leaveBtn: { backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  leaveBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  codeCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  codeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 1 },
  code: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 8, marginVertical: 4 },
  copyBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  copyText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  codeSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1, marginBottom: 8 },
  playerList: { flex: 1, marginBottom: 12 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  playerEmoji: { fontSize: 24, marginRight: 10 },
  playerName: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  readyBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  readyText: { fontSize: 12, fontWeight: '700' },
  botHint: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  actions: { gap: 10 },
  readyBtn: { backgroundColor: '#E5E7EB', borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  readyBtnActive: { backgroundColor: '#22C55E' },
  readyBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  botBtn: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  botBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  startBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  startBtnWarning: { backgroundColor: '#F59E0B' },
  startBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },
});
