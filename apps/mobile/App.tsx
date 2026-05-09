import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.emoji}>🎨</Text>
      <Text style={styles.title}>Doodle Dash</Text>
      <Text style={styles.subtitle}>The drawing game for kids!</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 Coming Soon</Text>
        <Text style={styles.cardText}>The game is being built.</Text>
        <Text style={styles.cardText}>Get ready to draw!</Text>
      </View>

      <View style={styles.iconRow}>
        <Text style={styles.icon}>✏️</Text>
        <Text style={styles.icon}>🏆</Text>
        <Text style={styles.icon}>⭐</Text>
        <Text style={styles.icon}>🎉</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: { fontSize: 72, marginBottom: 12 },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 32,
    width: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  iconRow: { flexDirection: 'row', gap: 16 },
  icon: { fontSize: 36 },
});
