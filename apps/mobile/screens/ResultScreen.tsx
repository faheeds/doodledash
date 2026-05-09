import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation, route }: Props) {
  const { prompt } = route.params;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🎨</Text>
        <Text style={styles.title}>Drawing saved!</Text>
        <Text style={styles.subtitle}>You drew: "{prompt}"</Text>
        <View style={styles.sparksCard}>
          <Text style={styles.sparksEmoji}>⚡</Text>
          <Text style={styles.sparksText}>+50 Sparks earned!</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnText}>🏠 Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('Play')}>
            <Text style={[styles.btnText, { color: COLORS.primary }]}>Draw Again ✏️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textLight, marginBottom: 32, textAlign: 'center' },
  sparksCard: { backgroundColor: '#FEF3C7', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 40, borderWidth: 2, borderColor: '#FACC15' },
  sparksEmoji: { fontSize: 32 },
  sparksText: { fontSize: 20, fontWeight: '800', color: '#92400E' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, minWidth: 130, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
