import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNfcReader } from '@/hooks/use-nfc-reader';

export default function HomeScreen() {
  const state = useNfcReader();

  const currentLabel =
    state.availability === 'unavailable'
      ? 'No es posible escanear. Activá NFC para continuar.'
      : state.current.status === 'waiting'
        ? 'Esperando una pulsera…'
        : state.current.status === 'detected'
          ? 'Pulsera detectada'
          : state.current.message;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Lectura de pulseras NFC</Text>

        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.resultCard,
            state.current.status === 'error' && styles.errorCard,
            state.availability === 'unavailable' && styles.unavailableCard,
          ]}
        >
          <Text style={styles.sectionTitle}>Estado actual</Text>
          <Text style={styles.resultText}>{currentLabel}</Text>
          {state.availability === 'available' && state.current.status === 'detected' && (
            <Text selectable style={styles.identifier}>
              {state.current.identifier}
            </Text>
          )}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de lecturas exitosas</Text>
          {state.history.length === 0 ? (
            <Text style={styles.secondaryText}>Todavía no hay lecturas.</Text>
          ) : (
            state.history.map((identifier, index) => (
              <View key={`${index}-${identifier}`} style={styles.historyRow}>
                <Text style={styles.historyLabel}>Lectura {index + 1}</Text>
                <Text selectable style={styles.historyIdentifier}>
                  {identifier}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  title: {
    color: '#17212b',
    fontSize: 24,
    fontWeight: '700',
  },
  resultCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#e8f4ed',
    gap: 10,
  },
  errorCard: {
    backgroundColor: '#fff1f0',
  },
  unavailableCard: {
    backgroundColor: '#fff6df',
  },
  sectionTitle: {
    color: '#344454',
    fontSize: 16,
    fontWeight: '600',
  },
  resultText: {
    color: '#17212b',
    fontSize: 18,
  },
  identifier: {
    color: '#17212b',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  historySection: {
    gap: 12,
  },
  secondaryText: {
    color: '#657384',
    fontSize: 15,
  },
  historyRow: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  historyLabel: {
    color: '#657384',
    fontSize: 13,
  },
  historyIdentifier: {
    color: '#17212b',
    fontSize: 16,
    fontWeight: '600',
  },
});
