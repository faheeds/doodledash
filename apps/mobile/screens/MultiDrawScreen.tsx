import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import DrawingCanvas, { Stroke } from '../components/canvas/DrawingCanvas';
import Toolbar from '../components/canvas/Toolbar';
import CountdownTimer from '../components/canvas/CountdownTimer';
import { useDrawing } from '../hooks/useDrawing';
import { useTimer } from '../hooks/useTimer';
import { supabase, subscribeToMatch } from '../utils/supabase';
import { COLORS } from '../constants/colors';
import { PROMPTS } from '../constants/prompts';
import { GAME_CONSTANTS } from '../constants/game';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiDraw'>;

function strokesToSVG(strokes: Stroke[], w = 300, h = 300, bg = '#FFFFFF'): string {
  const lastFill = [...strokes].reverse().find(s => s.isFill);
  const bgColor = lastFill ? lastFill.fillColor! : bg;
  const paths = strokes
    .filter(s => !s.isFill && s.points)
    .map(s => `<path d="${s.points}" stroke="${s.color}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${paths}</svg>`;
}

function botSVG(prompt: string, botName?: string): string {
  const palettes = [
    ['#FF6B6B','#FFD93D','#6BCB77'],
    ['#4ECDC4','#45B7D1','#96CEB4'],
    ['#FFA07A','#F8B500','#FF6B9D'],
    ['#A29BFE','#6C5CE7','#74B9FF'],
    ['#55EFC4','#00CEC9','#81ECEC'],
  ];
  const seed = (botName || prompt).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pal = palettes[seed % palettes.length];
  const [c1, c2, c3] = pal;
  const style = seed % 8;
  const label = prompt.slice(0, 22);

  const drawings = [
    // 0: creature with body + eyes + smile
    `<rect width="300" height="300" fill="#FFFBF0"/>
     <ellipse cx="150" cy="155" rx="70" ry="80" fill="${c1}" stroke="${c2}" stroke-width="4"/>
     <circle cx="125" cy="130" r="14" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="175" cy="130" r="14" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="129" cy="132" r="7" fill="#333"/>
     <circle cx="179" cy="132" r="7" fill="#333"/>
     <path d="M 125 168 Q 150 188 175 168" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round"/>
     <ellipse cx="110" cy="165" rx="12" ry="8" fill="${c3}" opacity="0.7"/>
     <ellipse cx="190" cy="165" rx="12" ry="8" fill="${c3}" opacity="0.7"/>`,

    // 1: house scene
    `<rect width="300" height="300" fill="#E8F4FD"/>
     <rect x="60" y="280" width="300" height="30" fill="#7EC850"/>
     <rect x="85" y="185" width="130" height="100" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <polygon points="85,185 150,110 215,185" fill="${c2}"/>
     <rect x="130" y="230" width="40" height="55" fill="${c3}" stroke="${c2}" stroke-width="2"/>
     <rect x="95" y="205" width="35" height="35" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="230" cy="70" r="35" fill="#FFD700" opacity="0.9"/>`,

    // 2: animal face (cat-like)
    `<rect width="300" height="300" fill="#FFF9EC"/>
     <circle cx="150" cy="160" r="90" fill="${c1}" stroke="${c2}" stroke-width="4"/>
     <ellipse cx="105" cy="95" rx="22" ry="35" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <ellipse cx="195" cy="95" rx="22" ry="35" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <ellipse cx="105" cy="95" rx="12" ry="22" fill="${c3}"/>
     <ellipse cx="195" cy="95" rx="12" ry="22" fill="${c3}"/>
     <ellipse cx="122" cy="152" rx="18" ry="12" fill="#333"/>
     <ellipse cx="178" cy="152" rx="18" ry="12" fill="#333"/>
     <circle cx="126" cy="150" r="5" fill="white"/>
     <circle cx="182" cy="150" r="5" fill="white"/>
     <path d="M 150 170 Q 148 182 140 185 M 150 170 Q 152 182 160 185" stroke="${c2}" stroke-width="3" fill="none"/>
     <circle cx="150" cy="170" r="10" fill="${c3}"/>`,

    // 3: underwater scene
    `<rect width="300" height="300" fill="#B8E8FF"/>
     <rect x="0" y="220" width="300" height="80" fill="#7EC8E3" opacity="0.5"/>
     <ellipse cx="150" cy="170" rx="65" ry="40" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <polygon points="215,155 245,135 245,185" fill="${c2}"/>
     <circle cx="125" cy="158" r="9" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="128" cy="158" r="5" fill="#333"/>
     <path d="M 130 175 Q 148 188 165 175" stroke="${c2}" stroke-width="3" fill="none"/>
     <circle cx="80" cy="120" r="8" fill="white" stroke="${c2}" stroke-width="2" opacity="0.8"/>
     <circle cx="210" cy="200" r="18" fill="${c3}" stroke="${c2}" stroke-width="2"/>
     <path d="M 210 182 L 205 200 L 215 200 Z M 198 188 L 210 195 L 208 184 Z" fill="${c2}"/>`,

    // 4: rocket in space
    `<rect width="300" height="300" fill="#1a1a2e"/>
     <circle cx="50" cy="60" r="4" fill="white"/>
     <circle cx="240" cy="40" r="3" fill="white"/>
     <circle cx="180" cy="90" r="5" fill="white"/>
     <circle cx="90" cy="200" r="3" fill="white"/>
     <circle cx="260" cy="180" r="4" fill="white"/>
     <polygon points="150,60 120,175 180,175" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <circle cx="150" cy="120" r="22" fill="#B8E8FF" stroke="${c2}" stroke-width="2"/>
     <polygon points="120,175 100,200 150,188" fill="${c2}"/>
     <polygon points="180,175 200,200 150,188" fill="${c2}"/>
     <ellipse cx="150" cy="192" rx="30" ry="14" fill="${c3}" opacity="0.7"/>
     <ellipse cx="150" cy="198" rx="20" ry="10" fill="#FF6B35" opacity="0.9"/>`,

    // 5: food / yummy thing
    `<rect width="300" height="300" fill="#FFF5E4"/>
     <ellipse cx="150" cy="180" rx="100" ry="70" fill="${c1}" stroke="${c2}" stroke-width="4"/>
     <ellipse cx="150" cy="160" rx="100" ry="55" fill="${c2}"/>
     <ellipse cx="150" cy="148" rx="85" ry="42" fill="${c1}"/>
     <circle cx="115" cy="145" r="14" fill="${c3}" stroke="white" stroke-width="2"/>
     <circle cx="152" cy="138" r="14" fill="${c3}" stroke="white" stroke-width="2"/>
     <circle cx="188" cy="145" r="14" fill="${c3}" stroke="white" stroke-width="2"/>
     <path d="M 110 75 Q 115 50 125 75 Q 135 55 140 75" stroke="${c2}" stroke-width="3" fill="none"/>`,

    // 6: superhero / character
    `<rect width="300" height="300" fill="#F0F4FF"/>
     <circle cx="150" cy="105" r="50" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <circle cx="134" cy="95" r="10" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="166" cy="95" r="10" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="137" cy="96" r="5" fill="#333"/>
     <circle cx="169" cy="96" r="5" fill="#333"/>
     <path d="M 133 122 Q 150 135 167 122" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round"/>
     <rect x="110" y="155" width="80" height="90" rx="10" fill="${c2}" stroke="${c1}" stroke-width="3"/>
     <polygon points="110,155 85,130 95,175" fill="${c3}"/>
     <polygon points="190,155 215,130 205,175" fill="${c3}"/>
     <rect x="130" y="245" width="25" height="50" rx="8" fill="${c2}"/>
     <rect x="145" y="245" width="25" height="50" rx="8" fill="${c2}"/>`,

    // 7: landscape / nature
    `<rect width="300" height="300" fill="#87CEEB"/>
     <ellipse cx="60" cy="80" rx="45" ry="35" fill="white" opacity="0.9"/>
     <ellipse cx="95" cy="65" rx="40" ry="30" fill="white" opacity="0.9"/>
     <ellipse cx="130" cy="75" rx="35" ry="28" fill="white" opacity="0.9"/>
     <rect x="0" y="220" width="300" height="80" fill="#7EC850"/>
     <rect x="0" y="200" width="300" height="30" fill="#5AB040"/>
     <rect x="68" y="140" width="20" height="70" fill="#8B6914"/>
     <ellipse cx="78" cy="130" rx="42" ry="48" fill="${c1}"/>
     <rect x="175" y="155" width="18" height="55" fill="#8B6914"/>
     <ellipse cx="184" cy="145" rx="35" ry="40" fill="${c2}"/>
     <circle cx="230" cy="60" r="30" fill="#FFD700"/>`,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
    ${drawings[style]}
    <text x="150" y="292" text-anchor="middle" font-size="10" fill="#999" font-family="sans-serif">${label}</text>
  </svg>`;
}


const MAGIC_STAMPS = [
  // 5-pointed star
  'M 150 100 L 161 137 L 200 137 L 169 160 L 181 197 L 150 175 L 119 197 L 131 160 L 100 137 L 139 137 Z',
  // Heart
  'M 150 195 C 100 170 82 140 82 118 C 82 95 100 82 122 90 C 134 95 143 106 150 118 C 157 106 166 95 178 90 C 200 82 218 95 218 118 C 218 140 200 170 150 195 Z',
  // Lightning bolt
  'M 165 90 L 133 152 L 157 152 L 137 215 L 177 147 L 152 147 Z',
  // Crown
  'M 88 195 L 88 140 L 113 163 L 150 112 L 187 163 L 212 140 L 212 195 Z',
  // Diamond
  'M 150 95 L 205 150 L 150 205 L 95 150 Z',
  // 8-pointed burst
  'M 150 95 L 161 133 L 198 115 L 177 145 L 210 150 L 177 155 L 198 185 L 161 167 L 150 205 L 139 167 L 102 185 L 123 155 L 90 150 L 123 145 L 102 115 L 139 133 Z',
  // Arrow / rocket
  'M 150 90 L 195 148 L 168 148 L 168 210 L 132 210 L 132 148 L 105 148 Z',
  // Flower (4-petal)
  'M 150 108 C 168 108 182 122 182 140 C 182 152 176 158 165 160 C 176 162 182 168 182 180 C 182 198 168 212 150 212 C 132 212 118 198 118 180 C 118 168 124 162 135 160 C 124 158 118 152 118 140 C 118 122 132 108 150 108 Z',
];

function getRandomStamp(): string {
  return MAGIC_STAMPS[Math.floor(Math.random() * MAGIC_STAMPS.length)];
}

export default function MultiDrawScreen({ navigation, route }: Props) {
  const { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost } = route.params;
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(14);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [magicStampUsed, setMagicStampUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { strokes, addStroke, updateStrokes, undo, canUndo } = useDrawing();
  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  const submittedRef = useRef(false);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    const svgData = strokesToSVG(strokesRef.current);

    await supabase.from('drawings').insert({
      match_id: matchId,
      player_id: userId,
      round_number: round,
      prompt,
      svg_data: svgData,
    });

    if (isHost) {
      // Add bot drawings
      const { data: bots } = await supabase.from('match_players').select('display_name', {
        eqs: [['match_id', matchId], ['is_bot', true]],
      });

      for (const _bot of (bots || [])) {
        await supabase.from('drawings').insert({
          match_id: matchId,
          player_id: null,
          round_number: round,
          prompt,
          svg_data: botSVG(prompt, _bot.display_name),
          ai_score: Math.floor(Math.random() * 40) + 20,
          ai_feedback: 'Bot did their best!',
        });
      }

      // Move to voting
      await supabase.from('matches').update({ status: 'voting' }).eq('id', matchId);
    }
  }, [matchId, userId, round, prompt, isHost]);

  const { seconds, start } = useTimer(GAME_CONSTANTS.DRAW_TIME_SECONDS, submit);
  useEffect(() => { start(); }, []);

  const handleMagicStamp = useCallback(() => {
    if (magicStampUsed) return;
    setMagicStampUsed(true);
    const stamp = getRandomStamp();
    addStroke({ id: 'magic-' + Date.now(), points: stamp, color, size: 3, fillColor: color, isFill: false });
  }, [magicStampUsed, color, addStroke]);

  const handleDone = () => Alert.alert('Submit drawing?', 'Are you done?', [
    { text: 'Keep Drawing', style: 'cancel' },
    { text: 'Submit!', onPress: submit },
  ]);

  // Listen for host moving to voting (polling-based)
  useEffect(() => {
    const unsub = subscribeToMatch(matchId, (payload) => {
      const match = payload.new as any;
      if (match.status === 'voting') {
        navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
      }
    });
    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.promptBox}>
          <Text style={styles.roundLabel}>Round {round}/{totalRounds} · {roomCode}</Text>
          <Text style={styles.promptText} numberOfLines={2}>{prompt}</Text>
        </View>
        <TouchableOpacity style={[styles.doneBtn, submitted && styles.doneBtnDone]} onPress={handleDone} disabled={submitted}>
          <Text style={styles.doneBtnText}>{submitted ? 'Submitted!' : 'Done'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timerRow}>
        <CountdownTimer seconds={seconds} totalSeconds={GAME_CONSTANTS.DRAW_TIME_SECONDS} onTimeUp={submit} />
      </View>
      <View style={styles.canvasContainer}>
        <DrawingCanvas
          color={color} brushSize={brushSize} tool={tool}
          strokes={strokes} onStrokesChange={updateStrokes} onNewStroke={addStroke}
        />
      </View>
      <Toolbar
        selectedColor={color} selectedBrushSize={brushSize} selectedTool={tool}
        onColorSelect={setColor} onBrushSizeSelect={setBrushSize} onToolSelect={setTool}
        onUndo={undo} canUndo={canUndo}
        magicStampUsed={magicStampUsed} onMagicStamp={handleMagicStamp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  promptBox: { flex: 1 },
  roundLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 2 },
  promptText: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  doneBtnDone: { backgroundColor: '#22C55E' },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { paddingHorizontal: 12, marginVertical: 6 },
  canvasContainer: { flex: 1, marginHorizontal: 4 },
});
