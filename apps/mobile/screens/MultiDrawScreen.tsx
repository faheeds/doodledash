import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, BackHandler } from 'react-native';
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
  const p = prompt.toLowerCase();
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

  // Pick drawing style based on keywords in the prompt so bots attempt the right thing
  const isAnimal = /\b(cat|dog|pet|fish|bird|penguin|dinosaur|dragon|snail|cow|elephant|monster|creature|panda|bear|rabbit|fox|wolf|horse|tiger|lion|bunny|duck|frog|snake|turtle)\b/.test(p);
  const isFood  = /\b(food|sandwich|pizza|cake|burger|taco|spaghetti|breakfast|lunch|dinner|snack|eat|ice cream|donut|candy|fruit|banana|cookie|pie)\b/.test(p);
  const isHouse = /\b(house|home|treehouse|building|castle|cabin)\b/.test(p);
  const isSpace = /\b(rocket|space|star|moon|planet|astronaut|alien|galaxy|ufo)\b/.test(p);
  const isWater = /\b(fish|ocean|sea|underwater|swimming|shark|whale|jellyfish|boat|wave|lake|river)\b/.test(p);
  const isHero  = /\b(superhero|costume|hero|cape|powers|super|wizard|knight|ninja|pirate)\b/.test(p);
  const isNature= /\b(tree|forest|garden|flower|park|mountain|nature|landscape|jungle)\b/.test(p);

  let style: number;
  if (isFood)   style = 5;
  else if (isWater) style = 3;
  else if (isSpace) style = 4;
  else if (isHouse) style = 1;
  else if (isHero)  style = 6;
  else if (isNature) style = 7;
  else if (isAnimal) style = seed % 2 === 0 ? 0 : 2; // creature or animal face
  else style = seed % 8; // fallback: random

  const label = prompt.slice(0, 22);

  // Sketch filter gives a hand-drawn wobbly feel — low frequency = gentle wobble
  const sketchFilter = `
    <defs>
      <filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="${seed % 99}" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>`;

  const drawings = [
    // 0: creature with body + eyes + smile
    `<rect width="300" height="300" fill="#FFFBF0"/>
     <g filter="url(#sketch)">
     <ellipse cx="150" cy="155" rx="70" ry="80" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <circle cx="125" cy="130" r="14" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="175" cy="130" r="14" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="129" cy="132" r="7" fill="#333"/>
     <circle cx="179" cy="132" r="7" fill="#333"/>
     <path d="M 128 168 Q 150 190 172 168" stroke="${c2}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
     <ellipse cx="110" cy="165" rx="12" ry="8" fill="${c3}" opacity="0.7"/>
     <ellipse cx="190" cy="165" rx="12" ry="8" fill="${c3}" opacity="0.7"/>
     </g>`,

    // 1: house
    `<rect width="300" height="300" fill="#E8F4FD"/>
     <g filter="url(#sketch)">
     <rect x="0" y="260" width="300" height="40" fill="#7EC850"/>
     <rect x="85" y="185" width="130" height="80" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <polygon points="80,188 150,108 220,188" fill="${c2}" stroke="${c2}" stroke-width="2"/>
     <rect x="130" y="228" width="40" height="57" fill="${c3}" stroke="${c2}" stroke-width="2"/>
     <rect x="93" y="202" width="35" height="35" fill="white" stroke="${c2}" stroke-width="2"/>
     <line x1="110" y1="202" x2="110" y2="237" stroke="${c2}" stroke-width="1.5"/>
     <line x1="93" y1="220" x2="128" y2="220" stroke="${c2}" stroke-width="1.5"/>
     <circle cx="230" cy="68" r="34" fill="#FFD700" opacity="0.9"/>
     </g>`,

    // 2: animal face (cat ears)
    `<rect width="300" height="300" fill="#FFF9EC"/>
     <g filter="url(#sketch)">
     <circle cx="150" cy="162" r="88" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <ellipse cx="106" cy="97" rx="22" ry="34" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <ellipse cx="194" cy="97" rx="22" ry="34" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <ellipse cx="106" cy="97" rx="12" ry="22" fill="${c3}"/>
     <ellipse cx="194" cy="97" rx="12" ry="22" fill="${c3}"/>
     <ellipse cx="123" cy="153" rx="18" ry="13" fill="#333"/>
     <ellipse cx="177" cy="153" rx="18" ry="13" fill="#333"/>
     <circle cx="127" cy="151" r="5" fill="white"/>
     <circle cx="181" cy="151" r="5" fill="white"/>
     <path d="M 150 172 Q 148 183 140 186 M 150 172 Q 152 183 160 186" stroke="${c2}" stroke-width="2.5" fill="none"/>
     <circle cx="150" cy="172" r="10" fill="${c3}"/>
     </g>`,

    // 3: underwater scene
    `<rect width="300" height="300" fill="#B8E8FF"/>
     <g filter="url(#sketch)">
     <rect x="0" y="215" width="300" height="85" fill="#7EC8E3" opacity="0.5"/>
     <ellipse cx="150" cy="172" rx="65" ry="40" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <polygon points="215,157 248,137 248,187" fill="${c2}"/>
     <circle cx="126" cy="160" r="9" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="129" cy="160" r="5" fill="#333"/>
     <path d="M 132 177 Q 148 190 164 177" stroke="${c2}" stroke-width="3" fill="none"/>
     <circle cx="82" cy="122" r="9" fill="white" stroke="${c2}" stroke-width="2" opacity="0.8"/>
     <circle cx="212" cy="202" r="18" fill="${c3}" stroke="${c2}" stroke-width="2"/>
     <path d="M 200 196 L 207 208 L 217 196 Z" fill="${c2}"/>
     <path d="M 200 208 L 207 220 L 217 208 Z" fill="${c2}"/>
     </g>`,

    // 4: rocket in space
    `<rect width="300" height="300" fill="#1a1a2e"/>
     <g filter="url(#sketch)">
     <circle cx="50" cy="60" r="3" fill="white"/>
     <circle cx="240" cy="42" r="2.5" fill="white"/>
     <circle cx="180" cy="90" r="4" fill="white"/>
     <circle cx="90" cy="198" r="3" fill="white"/>
     <circle cx="260" cy="178" r="3.5" fill="white"/>
     <circle cx="30" cy="180" r="2" fill="white"/>
     <polygon points="150,58 118,178 182,178" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <circle cx="150" cy="118" r="22" fill="#B8E8FF" stroke="${c2}" stroke-width="2"/>
     <polygon points="118,178 95,205 148,192" fill="${c2}"/>
     <polygon points="182,178 205,205 152,192" fill="${c2}"/>
     <ellipse cx="150" cy="194" rx="30" ry="13" fill="${c3}" opacity="0.6"/>
     <ellipse cx="150" cy="200" rx="18" ry="10" fill="#FF6B35" opacity="0.8"/>
     </g>`,

    // 5: food (layered sandwich/burger)
    `<rect width="300" height="300" fill="#FFF5E4"/>
     <g filter="url(#sketch)">
     <ellipse cx="150" cy="188" rx="98" ry="32" fill="${c2}" stroke="#8B4513" stroke-width="2"/>
     <rect x="55" y="168" width="190" height="24" fill="${c3}"/>
     <rect x="52" y="150" width="196" height="22" fill="#F4C430"/>
     <rect x="55" y="132" width="190" height="22" fill="${c1}"/>
     <ellipse cx="150" cy="132" rx="98" ry="28" fill="${c2}" stroke="#8B4513" stroke-width="2"/>
     <circle cx="110" cy="168" r="10" fill="#DC143C" opacity="0.8"/>
     <circle cx="152" cy="165" r="10" fill="#DC143C" opacity="0.8"/>
     <circle cx="192" cy="168" r="10" fill="#DC143C" opacity="0.8"/>
     <path d="M 80 100 Q 85 75 96 100 Q 107 78 115 100" stroke="#228B22" stroke-width="3" fill="none"/>
     </g>`,

    // 6: superhero figure
    `<rect width="300" height="300" fill="#F0F4FF"/>
     <g filter="url(#sketch)">
     <circle cx="150" cy="105" r="48" fill="${c1}" stroke="${c2}" stroke-width="3"/>
     <circle cx="135" cy="95" r="10" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="165" cy="95" r="10" fill="white" stroke="${c2}" stroke-width="2"/>
     <circle cx="138" cy="97" r="5" fill="#333"/>
     <circle cx="168" cy="97" r="5" fill="#333"/>
     <path d="M 134 122 Q 150 136 166 122" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round"/>
     <rect x="112" y="153" width="76" height="88" rx="8" fill="${c2}" stroke="${c1}" stroke-width="3"/>
     <polygon points="112,155 84,128 96,175" fill="${c3}"/>
     <polygon points="188,155 216,128 204,175" fill="${c3}"/>
     <rect x="132" y="241" width="24" height="52" rx="8" fill="${c2}"/>
     <rect x="144" y="241" width="24" height="52" rx="8" fill="${c2}"/>
     </g>`,

    // 7: landscape with trees + sun
    `<rect width="300" height="300" fill="#87CEEB"/>
     <g filter="url(#sketch)">
     <ellipse cx="62" cy="82" rx="44" ry="34" fill="white" opacity="0.85"/>
     <ellipse cx="97" cy="68" rx="40" ry="30" fill="white" opacity="0.85"/>
     <ellipse cx="130" cy="78" rx="35" ry="28" fill="white" opacity="0.85"/>
     <rect x="0" y="218" width="300" height="82" fill="#7EC850"/>
     <rect x="0" y="198" width="300" height="28" fill="#5AB040"/>
     <rect x="70" y="140" width="18" height="68" fill="#8B6914"/>
     <ellipse cx="79" cy="128" rx="42" ry="48" fill="${c1}"/>
     <rect x="177" y="155" width="16" height="53" fill="#8B6914"/>
     <ellipse cx="185" cy="143" rx="34" ry="40" fill="${c2}"/>
     <circle cx="232" cy="60" r="30" fill="#FFD700"/>
     </g>`,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
    ${sketchFilter}
    ${drawings[style]}
    <text x="150" y="294" text-anchor="middle" font-size="10" fill="#aaa" font-family="sans-serif">${label}</text>
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

    // Save human drawing (non-fatal if it fails)
    try {
      const svgData = strokesToSVG(strokesRef.current);
      await supabase.from('drawings').insert({
        match_id: matchId,
        player_id: userId,
        round_number: round,
        prompt,
        svg_data: svgData,
      });
    } catch (e) {
      console.warn('Failed to save drawing:', e);
    }

    if (isHost) {
      // Add bot drawings — each insert is individually wrapped so one failure
      // doesn't block the rest or prevent match progression
      const { data: bots } = await supabase.from('match_players').select('display_name', {
        eqs: [['match_id', matchId], ['is_bot', true]],
      });

      for (const _bot of (bots || [])) {
        try {
          await supabase.from('drawings').insert({
            match_id: matchId,
            player_id: null,
            round_number: round,
            prompt,
            svg_data: botSVG(prompt, _bot.display_name),
            ai_score: Math.floor(Math.random() * 40) + 20,
            ai_feedback: 'Bot did their best!',
          });
        } catch (e) {
          console.warn('Bot drawing insert failed:', e);
        }
      }

      // Advance match status so non-host clients see it via polling
      try {
        await supabase.from('matches').update({ status: 'voting' }).eq('id', matchId);
      } catch (e) {
        console.warn('Failed to advance match status:', e);
      }

      // Host navigates immediately — don't sit waiting for the 2-second poll
      navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
    }
  }, [matchId, userId, round, prompt, isHost, navigation, roomCode, username]);

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

  const handleLeave = () => {
    Alert.alert(
      'Leave Game?',
      'Your drawing will not be saved. The game will continue without you.',
      [
        { text: 'Keep Drawing', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
        },
      ]
    );
  };

  // Listen for host moving to voting (polling-based) or match cancelled
  useEffect(() => {
    const unsub = subscribeToMatch(matchId, (payload) => {
      const match = payload.new as any;
      if (match.status === 'voting') {
        navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
      }
      if (match.status === 'cancelled') {
        Alert.alert('Game Over', 'The host has left the game.', [{ text: 'OK' }]);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeave();
      return true;
    });

    return () => { unsub(); backHandler.remove(); };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>✕</Text>
        </TouchableOpacity>
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
      <View style={styles.canvasContainer} pointerEvents={submitted ? 'none' : 'auto'}>
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
  leaveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  leaveBtnText: { color: '#DC2626', fontWeight: '900', fontSize: 15 },
  promptBox: { flex: 1 },
  roundLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 2 },
  promptText: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  doneBtnDone: { backgroundColor: '#22C55E' },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { paddingHorizontal: 12, marginVertical: 6 },
  canvasContainer: { flex: 1, marginHorizontal: 4 },
});
