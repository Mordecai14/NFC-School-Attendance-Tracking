import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNfcReader } from '@/hooks/use-nfc-reader';
import { developmentAuth } from '@/hooks/use-development-login';
import { lookupStudent, type Student } from '@/services/student-lookup';

export default function HomeScreen() {
  const state = useNfcReader();
  const { availability, current } = state;
  const [lookup, setLookup] = useState<{
    reading: typeof state.current;
    student: Student | null;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    const reading = current;
    if (availability !== 'available' || reading.status !== 'detected') return;
    let active = true;
    void lookupStudent(
      reading.identifier,
      Constants.expoConfig?.extra?.supabaseUrl,
      Constants.expoConfig?.extra?.supabasePublishableKey,
      developmentAuth.getAccessToken,
    ).then(
      (student) => { if (active) setLookup({ reading, student, error: false }); },
      () => { if (active) setLookup({ reading, student: null, error: true }); },
    );
    return () => { active = false; };
  }, [availability, current]);

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
            <>
              <Text selectable style={styles.identifier}>{state.current.identifier}</Text>
              {lookup?.reading !== state.current ? (
                <Text style={styles.secondaryText}>Buscando alumno…</Text>
              ) : lookup.error ? (
                <Text style={styles.resultText}>No se pudo consultar el alumno. Comprueba la sesión y la conexión, y vuelve a escanear.</Text>
              ) : lookup.student ? (
                <View style={styles.studentCard}>
                  <Text style={styles.sectionTitle}>Alumno</Text>
                  <Text style={styles.studentName}>{lookup.student.first_name} {lookup.student.last_name}</Text>
                  <Text style={styles.secondaryText}>
                    Grado: {lookup.student.grade ?? 'No registrado'} · Grupo: {lookup.student.group_name ?? 'No registrado'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.resultText}>No hay un alumno activo asignado a esta pulsera.</Text>
              )}
            </>
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
