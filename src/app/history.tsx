import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Historial de registros</Text>
        <Text>El historial aún no está implementado.</Text>
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
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  studentName: {
    color: '#17212b',
    fontSize: 22,
    fontWeight: '700',
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
