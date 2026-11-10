import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useNfcReader } from '@/hooks/use-nfc-reader';
import { developmentAuth } from '@/hooks/use-development-login';
import { lookupStudent, type Student } from '@/services/student-lookup';

function NfcSensorIndicator({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const animated = active && !reduceMotion;

  useEffect(() => {
    if (animated) {
      pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
    }
    return () => {
      cancelAnimation(pulse);
      pulse.value = 0;
    };
  }, [animated, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: animated ? 0.2 + pulse.value * 0.4 : 0,
    transform: [{ scale: 1 + pulse.value * 0.18 }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.sensorRing}
    >
      <Animated.View pointerEvents="none" style={[styles.sensorHalo, haloStyle]} />
      <View style={styles.sensorIcon}>
        <View style={[styles.signalArc, styles.signalArcOuter]} />
        <View style={[styles.signalArc, styles.signalArcMiddle]} />
        <View style={[styles.signalArc, styles.signalArcInner]} />
      </View>
    </View>
  );
}

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
        <View style={styles.header}>
          <Text style={styles.title}>Control de Asistencia</Text>
          <Text style={styles.secondaryText}>Escaneo NFC</Text>
        </View>
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.sensorCard,
            state.current.status === 'error' && styles.errorCard,
            state.availability === 'unavailable' && styles.unavailableCard,
          ]}
        >
          <NfcSensorIndicator active={availability === 'available' && current.status !== 'error'} />
          <Text style={styles.sensorTitle}>
            {availability === 'unavailable'
              ? 'NFC no disponible'
              : current.status === 'error'
                ? 'Error de lectura'
                : 'Sensor NFC Activo'}
          </Text>
          <Text style={styles.resultText}>{currentLabel}</Text>
        </View>

        {availability === 'available' && current.status === 'detected' && (
          <View accessibilityLiveRegion="polite" style={styles.resultCard}>
            <View style={styles.cardHeading}>
              <Text style={styles.sectionTitle}>Última pulsera detectada</Text>
            </View>
            <Text style={styles.historyLabel}>Identificador de pulsera</Text>
            <Text selectable style={styles.identifier}>{current.identifier}</Text>
            {lookup?.reading !== state.current ? (
              <Text style={styles.secondaryText}>Buscando alumno…</Text>
            ) : lookup.error ? (
              <Text style={styles.errorText}>No se pudo consultar el alumno. Comprueba la sesión y la conexión, y vuelve a escanear.</Text>
            ) : lookup.student ? (
              <View style={styles.studentCard}>
                <Text style={styles.sectionTitle}>Alumno</Text>
                <Text style={styles.studentName}>{lookup.student.first_name} {lookup.student.last_name}</Text>
                <Text style={styles.secondaryText}>
                  Grado: {lookup.student.grade ?? 'No registrado'} · Grupo: {lookup.student.group_name ?? 'No registrado'}
                </Text>
              </View>
            ) : (
              <Text style={styles.secondaryText}>No hay un alumno activo asignado a esta pulsera.</Text>
            )}
            <Text style={styles.disclaimer}>La lectura no confirma un registro de asistencia.</Text>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Lecturas recientes</Text>
          <Text style={styles.secondaryText}>Últimas lecturas de esta sesión</Text>
          {state.history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.sectionTitle}>Todavía no hay lecturas.</Text>
              <Text style={styles.secondaryText}>Las pulseras detectadas aparecerán aquí.</Text>
            </View>
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
    backgroundColor: '#faf8ff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    gap: 4,
    marginBottom: 4,
  },
  title: {
    color: '#4f46e5',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sensorCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eeedf4',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  sensorRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#dedbfc',
    backgroundColor: '#eeecff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sensorIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  signalArc: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'transparent',
    borderRightColor: '#ffffff',
  },
  signalArcOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  signalArcMiddle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  signalArcInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  sensorTitle: {
    color: '#131b2e',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eeedf4',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  cardHeading: {
    borderBottomWidth: 1,
    borderBottomColor: '#eaedff',
    paddingBottom: 12,
    marginBottom: 4,
  },
  errorCard: {
    backgroundColor: '#fff0ee',
    borderColor: '#ffdad6',
  },
  unavailableCard: {
    backgroundColor: '#fff6df',
    borderColor: '#f5df9c',
  },
  sectionTitle: {
    color: '#464555',
    fontSize: 14,
    fontWeight: '600',
  },
  resultText: {
    color: '#464555',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    color: '#ba1a1a',
    fontSize: 15,
    lineHeight: 22,
  },
  identifier: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    flexShrink: 1,
  },
  studentCard: {
    gap: 8,
    paddingVertical: 8,
  },
  studentName: {
    color: '#131b2e',
    fontSize: 22,
    fontWeight: '700',
  },
  historySection: {
    gap: 8,
    marginTop: 4,
  },
  historyTitle: {
    color: '#131b2e',
    fontSize: 22,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#464555',
    fontSize: 14,
    lineHeight: 21,
  },
  disclaimer: {
    color: '#464555',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eeedf4',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  historyRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eeedf4',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  historyLabel: {
    color: '#464555',
    fontSize: 13,
  },
  historyIdentifier: {
    color: '#131b2e',
    fontSize: 16,
    fontWeight: '600',
  },
});
