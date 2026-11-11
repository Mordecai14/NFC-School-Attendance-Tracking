import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useAttendanceRegistration } from '@/hooks/use-attendance-registration';
import { useAttendanceScanner } from '@/hooks/use-attendance-scanner';

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
  const attendance = useAttendanceRegistration();
  const scanner = useAttendanceScanner();
  const state = useNfcReader(scanner.scan);
  const { availability, current } = state;
  const lookup = scanner.state;
  const registration = attendance.state;
  const canScan = ['idle', 'saved'].includes(registration.status) && lookup.status !== 'looking-up';
  const mode = registration.pending?.event.type ?? lookup.mode;
  const displayedEvent = registration.status === 'saved' ? registration.confirmed : registration.pending;
  const currentConfirmed = registration.status === 'saved' && !!lookup.student &&
    registration.confirmed?.event.bracelet_id === lookup.student.bracelet_id &&
    registration.confirmed?.event.type === lookup.readingMode;

  const currentLabel =
    state.availability === 'unavailable'
      ? 'No es posible escanear. Activá NFC para continuar.'
      : !canScan
        ? lookup.status === 'looking-up' ? 'Identificando al alumno y procesando el movimiento…' : 'Resuelve el registro pendiente antes de continuar.'
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
        <View accessibilityRole="radiogroup" accessibilityLabel="Modo de registro de asistencia" style={styles.modeSelector}>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Entrada"
            accessibilityState={{ checked: mode === 'entry', selected: mode === 'entry', disabled: !canScan }}
            disabled={!canScan}
            onPress={() => scanner.selectMode('entry')}
            style={({ pressed }) => [styles.modeOption, mode === 'entry' && styles.modeEntrySelected, !canScan && styles.disabledButton, pressed && styles.pressedButton]}
          >
            <Text style={[styles.modeText, mode === 'entry' && styles.modeSelectedText]}>↘ ENTRADA</Text>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Salida"
            accessibilityState={{ checked: mode === 'exit', selected: mode === 'exit', disabled: !canScan }}
            disabled={!canScan}
            onPress={() => scanner.selectMode('exit')}
            style={({ pressed }) => [styles.modeOption, mode === 'exit' && styles.modeExitSelected, !canScan && styles.disabledButton, pressed && styles.pressedButton]}
          >
            <Text style={[styles.modeText, mode === 'exit' && styles.modeSelectedText]}>↗ SALIDA</Text>
          </Pressable>
        </View>
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.sensorCard,
            state.current.status === 'error' && styles.errorCard,
            state.availability === 'unavailable' && styles.unavailableCard,
          ]}
        >
          <NfcSensorIndicator active={canScan && availability === 'available' && current.status !== 'error'} />
          <Text style={styles.sensorTitle}>
            {availability === 'unavailable'
              ? 'NFC no disponible'
              : current.status === 'error'
                ? 'Error de lectura'
                : !canScan ? 'Espera la confirmación'
                  : mode === 'entry' ? 'Sensor NFC Activo (Entradas)' : 'Sensor NFC Activo (Salidas)'}
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
            {lookup.status === 'looking-up' ? (
              <Text style={styles.secondaryText}>Identificando alumno y registrando el movimiento seleccionado…</Text>
            ) : lookup.status === 'error' ? (
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
            <Text style={styles.disclaimer}>
              {lookup.status === 'duplicate'
                ? 'La última asistencia de esta pulsera ya está confirmada en este modo. Para repetirla intencionalmente, selecciona de nuevo el modo y vuelve a acercar la pulsera.'
                : currentConfirmed
                  ? 'Registro confirmado. Selecciona el modo antes de acercar la siguiente pulsera.'
                  : 'El movimiento usa el modo seleccionado al leer la pulsera. Espera la confirmación de guardado.'}
            </Text>
          </View>
        )}

        {(registration.status !== 'idle' || registration.error) && (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.resultCard, registration.status === 'saved' && styles.confirmedCard]}
          >
            <Text style={styles.sectionTitle}>
              {registration.status === 'saved' ? 'Último registro confirmado'
                : registration.status === 'saving' ? 'Guardando asistencia…'
                  : registration.status === 'pending' ? 'Registro pendiente de confirmación'
                    : registration.status === 'loading' ? 'Comprobando registros pendientes…'
                      : 'No se puede registrar todavía'}
            </Text>
            {displayedEvent && (
              <>
                <Text style={styles.studentName}>{displayedEvent.studentName}</Text>
                <Text style={styles.secondaryText}>
                  {displayedEvent.event.type === 'entry' ? 'Entrada' : 'Salida'} · {new Date(displayedEvent.event.occurred_at).toLocaleTimeString()}
                </Text>
              </>
            )}
            {['loading', 'saving'].includes(registration.status) && <ActivityIndicator color="#4f46e5" />}
            {registration.status === 'saved' && <Text style={styles.confirmedText}>El evento se guardó en Supabase.</Text>}
            {registration.status === 'pending' && (
              <>
                <Text style={styles.errorText}>
                  No se confirmó el guardado. Se conserva el mismo intento; reinténtalo antes de registrar otro movimiento.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { void attendance.retry(); }}
                  style={({ pressed }) => [styles.attendanceButton, styles.entryButton, pressed && styles.pressedButton]}
                >
                  <Text style={styles.entryButtonText}>Reintentar guardado</Text>
                </Pressable>
              </>
            )}
            {registration.status === 'blocked' && (
              <Text style={styles.errorText}>No se pudo recuperar el almacenamiento local. No borres los datos de la app; reiníciala y comprueba el registro pendiente antes de continuar.</Text>
            )}
            {registration.error === 'prepare' && (
              <Text style={styles.errorText}>No se envió ningún evento. Comprueba la sesión, la conexión y que la escuela tenga un único dispositivo activo; vuelve a acercar la pulsera.</Text>
            )}
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
  modeSelector: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dedbfc',
    backgroundColor: '#eaedff',
  },
  modeOption: { flex: 1, minHeight: 52, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  modeText: { color: '#464555', fontSize: 16, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
  modeSelectedText: { color: '#ffffff' },
  modeEntrySelected: { backgroundColor: '#047857' },
  modeExitSelected: { backgroundColor: '#b45309' },
  attendanceButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryButton: { backgroundColor: '#4f46e5' },
  entryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.8 },
  confirmedCard: { backgroundColor: '#eefbf3', borderColor: '#b4dec3' },
  confirmedText: { color: '#176b38', fontSize: 15, fontWeight: '600' },
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
