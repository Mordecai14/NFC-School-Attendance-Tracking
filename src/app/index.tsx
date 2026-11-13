import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

function NfcSensorIndicator({ active, color }: { active: boolean; color: string }) {
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
      <Animated.View pointerEvents="none" style={[styles.sensorHalo, { borderColor: color }, haloStyle]} />
      <View style={[styles.sensorIcon, { backgroundColor: color }]}>
        <View style={[styles.signalArc, styles.signalArcOuter]} />
        <View style={[styles.signalArc, styles.signalArcMiddle]} />
        <View style={[styles.signalArc, styles.signalArcInner]} />
      </View>
    </View>
  );
}

const MODE_VIEW = {
  entry: { label: 'ENTRADA', title: 'Entradas', arrow: '↘', color: '#047857', soft: '#d1fae5', dark: '#065f46' },
  exit: { label: 'SALIDA', title: 'Salidas', arrow: '↗', color: '#b45309', soft: '#fef3c7', dark: '#92400e' },
} as const;

export default function HomeScreen() {
  const attendance = useAttendanceRegistration();
  const scanner = useAttendanceScanner();
  const lookup = scanner.state;
  const registration = attendance.state;
  const mode = registration.pending?.event.type ?? lookup.mode;
  const state = useNfcReader(scanner.scan);
  const { availability, current } = state;
  const [switchOpen, setSwitchOpen] = useState(false);
  const canScan = ['idle', 'saved'].includes(registration.status) && lookup.status !== 'looking-up';
  // Solo se muestra el registro del modo activo; el del otro modo se conserva pero queda oculto.
  const lastEvent = registration.status === 'saved' ? registration.confirmed : registration.pending;
  const displayedEvent = lastEvent?.event.type === mode ? lastEvent : null;
  const showRegistrationCard = !!registration.error ||
    (registration.status !== 'idle' && (registration.status !== 'saved' || !!displayedEvent));
  // La lectura detectada pertenece al modo con el que se escaneó.
  const detectedHere = current.status === 'detected' && lookup.readingMode === mode;
  const view = MODE_VIEW[mode];
  const otherMode = mode === 'entry' ? 'exit' : 'entry';
  const otherView = MODE_VIEW[otherMode];
  const recent = lookup.recent[mode];

  const currentConfirmed = registration.status === 'saved' && !!lookup.student &&
    registration.confirmed?.event.bracelet_id === lookup.student.bracelet_id &&
    registration.confirmed?.event.type === lookup.readingMode;
  const displayedStudent = displayedEvent && lookup.student &&
    displayedEvent.event.student_id === lookup.student.id &&
    displayedEvent.event.school_id === lookup.student.school_id &&
    displayedEvent.event.bracelet_id === lookup.student.bracelet_id
    ? lookup.student : null;

  const currentLabel =
    state.availability === 'unavailable'
      ? 'No es posible escanear. Activá NFC para continuar.'
      : !canScan
        ? lookup.status === 'looking-up' ? 'Identificando al alumno y procesando el movimiento…' : 'Resuelve el registro pendiente antes de continuar.'
        : state.current.status === 'waiting' || (state.current.status === 'detected' && !detectedHere)
        ? 'Acerca la pulsera al dispositivo'
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

        <View style={[styles.modeBanner, { backgroundColor: view.color, borderColor: view.dark }]}>
          <View style={styles.modeBannerText}>
            <Text style={styles.modeBannerCaption}>Modo actual</Text>
            <Text accessibilityRole="header" style={styles.modeBannerTitle}>{view.arrow} {view.title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cambiar a ${otherView.label}`}
            accessibilityState={{ disabled: !canScan }}
            disabled={!canScan}
            onPress={() => setSwitchOpen(true)}
            style={({ pressed }) => [styles.modeSwitchButton, !canScan && styles.disabledButton, pressed && styles.pressedButton]}
          >
            <Text style={[styles.modeSwitchText, { color: view.dark }]}>Cambiar</Text>
          </Pressable>
        </View>

        <Modal
          transparent
          animationType="fade"
          visible={switchOpen}
          onRequestClose={() => setSwitchOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View accessibilityViewIsModal style={styles.modalCard}>
              <Text accessibilityRole="header" style={styles.modalTitle}>¿Cambiar a {otherView.label}?</Text>
              <Text style={styles.secondaryText}>
                Las próximas pulseras se registrarán como {otherView.label.toLowerCase()}. Los registros de {view.label.toLowerCase()} se conservan y volverás a verlos al regresar.
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSwitchOpen(false)}
                  style={({ pressed }) => [styles.modalButton, styles.modalCancel, pressed && styles.pressedButton]}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    scanner.selectMode(otherMode);
                    setSwitchOpen(false);
                  }}
                  style={({ pressed }) => [styles.modalButton, { backgroundColor: otherView.color }, pressed && styles.pressedButton]}
                >
                  <Text style={styles.entryButtonText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.sensorCard,
            state.current.status === 'error' && styles.errorCard,
            state.availability === 'unavailable' && styles.unavailableCard,
          ]}
        >
          <NfcSensorIndicator color={view.color} active={canScan && availability === 'available' && current.status !== 'error'} />
          <Text style={styles.sensorTitle}>
            {availability === 'unavailable'
              ? 'NFC no disponible'
              : current.status === 'error'
              ? 'Error de lectura'
              : !canScan
              ? 'Espera la confirmación'
              : 'Sensor NFC Activo'}
          </Text>
          <Text style={styles.resultText}>{currentLabel}</Text>
        </View>

        {availability === 'available' && current.status === 'detected' && detectedHere &&
          (!currentConfirmed || !displayedStudent || lookup.status === 'duplicate') && (
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
                <Image
                  source={require('../../assets/images/student-placeholder.svg')}
                  style={styles.studentAvatar}
                  contentFit="cover"
                  accessible={false}
                />
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{lookup.student.first_name} {lookup.student.last_name}</Text>
                  <Text style={styles.secondaryText}>
                    Grado: {lookup.student.grade ?? 'No registrado'} · Grupo: {lookup.student.group_name ?? 'No registrado'}
                  </Text>
                </View>
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

        {showRegistrationCard && (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.resultCard,
              registration.status === 'pending' && styles.unavailableCard,
              registration.status === 'blocked' && styles.errorCard,
            ]}
          >
            <View style={[styles.cardHeading, styles.confirmationHeading]}>
              <View style={styles.confirmationLabel}>
                {registration.status === 'saved' && (
                  <Text accessible={false} style={styles.confirmationIcon}>✓</Text>
                )}
                <Text style={[styles.sectionTitle, registration.status === 'saved' && styles.confirmedText]}>
                  {registration.status === 'saved' ? 'Último registro confirmado'
                    : registration.status === 'saving' ? 'Guardando asistencia…'
                    : registration.status === 'pending' ? 'Registro pendiente de confirmación'
                      : registration.status === 'loading' ? 'Comprobando registros pendientes…'
                      : 'No se puede registrar todavía'}
                </Text>
              </View>
              {displayedEvent && (
                <Text style={styles.eventTime}>{new Date(displayedEvent.event.occurred_at).toLocaleTimeString()}</Text>
              )}
            </View>
            {displayedEvent && (
              <View style={styles.studentCard}>
                <Image
                  source={require('../../assets/images/student-placeholder.svg')}
                  style={styles.studentAvatar}
                  contentFit="cover"
                  accessible={false}
                />
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{displayedEvent.studentName}</Text>
                  <View style={styles.studentMeta}>
                    {displayedStudent && (
                      <Text style={styles.secondaryText}>
                        {displayedStudent.grade ?? '-'} · {displayedStudent.group_name ?? '-'}
                      </Text>
                    )}
                    <View style={[
                      styles.movementBadge,
                      registration.status === 'saved'
                        ? displayedEvent.event.type === 'entry' ? styles.entryBadge : styles.exitBadge
                        : styles.pendingBadge,
                    ]}>
                      <Text style={[
                        styles.movementText,
                        registration.status === 'saved'
                          ? displayedEvent.event.type === 'entry' ? styles.entryBadgeText : styles.exitBadgeText
                          : styles.pendingBadgeText,
                      ]}>
                        {displayedEvent.event.type === 'entry' ? 'Entrada' : 'Salida'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            {['loading', 'saving'].includes(registration.status) && <ActivityIndicator color="#4f46e5" />}
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
              <Text style={styles.errorText}>
                No se pudo recuperar el almacenamiento local. No borres los datos de la app; reiníciala y comprueba el registro pendiente antes de continuar.
              </Text>
            )}
            {registration.error === 'prepare' && (
              <Text style={styles.errorText}>
                No se envió ningún evento. Comprueba la sesión, la conexión y que la escuela tenga un único dispositivo activo; vuelve a acercar la pulsera.
              </Text>
            )}
          </View>
        )}

        <View style={styles.historySection}>
          <View style={styles.historyHeading}>
            <Text accessibilityRole="header" style={styles.historyTitle}>Lecturas de {view.title.toLowerCase()}</Text>
            <Text style={styles.historyCaption}>Esta sesión</Text>
          </View>
          {recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.sectionTitle}>Todavía no hay lecturas.</Text>
              <Text style={styles.secondaryText}>Los alumnos registrados aparecerán aquí.</Text>
            </View>
          ) : (
            recent.map(item => (
              <View key={item.id} style={styles.historyRow}>
                <Image
                  source={require('../../assets/images/student-placeholder.svg')}
                  style={styles.historyAvatar}
                  contentFit="cover"
                  accessible={false}
                />
                <View style={styles.historyDetails}>
                  <Text style={styles.historyIdentifier}>
                    {item.student.first_name} {item.student.last_name}
                  </Text>
                  <Text style={styles.historyLabel}>
                    {item.student.grade ?? '-'} · {item.student.group_name ?? '-'} · {new Date(item.occurred_at).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={[styles.historyBadge, { backgroundColor: view.soft }]}>
                  <Text style={[styles.historyBadgeText, { color: view.dark }]}>{view.label}</Text>
                </View>
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
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    gap: 4,
    marginBottom: 8,
  },
  title: {
    color: '#4f46e5',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sensorCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eeedf4',
    backgroundColor: '#ffffff',
    gap: 6,
    shadowColor: '#131b2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sensorRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#dedbfc',
    backgroundColor: '#eeecff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sensorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorHalo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  signalArcMiddle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  signalArcInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sensorTitle: {
    color: '#131b2e',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultCard: {
    padding: 16,
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
  confirmationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  confirmationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  confirmationIcon: {
    color: '#00976b',
    fontSize: 18,
    fontWeight: '700',
  },
  eventTime: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  studentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#e2dfff',
    backgroundColor: '#eaedff',
    flexShrink: 0,
  },
  studentDetails: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  movementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  movementText: { fontSize: 12, fontWeight: '700' },
  entryBadge: { backgroundColor: '#d1fae5' },
  entryBadgeText: { color: '#065f46' },
  exitBadge: { backgroundColor: '#fef3c7' },
  exitBadgeText: { color: '#92400e' },
  pendingBadge: { backgroundColor: '#eaedff' },
  pendingBadgeText: { color: '#464555' },
  studentName: {
    color: '#131b2e',
    fontSize: 18,
    fontWeight: '700',
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  modeBannerText: { flex: 1, gap: 2 },
  modeBannerCaption: { color: '#ffffffcc', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  modeBannerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  modeSwitchButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchText: { fontSize: 14, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  modalTitle: { color: '#131b2e', fontSize: 20, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: { backgroundColor: '#eaedff' },
  modalCancelText: { color: '#464555', fontSize: 14, fontWeight: '700' },
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
  confirmedText: { color: '#008f68', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  historySection: {
    gap: 8,
    marginTop: 4,
  },
  historyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  historyCaption: {
    color: '#464555',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  historyTitle: {
    color: '#131b2e',
    fontSize: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eeedf4',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  historyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eaedff',
    flexShrink: 0,
  },
  historyDetails: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eeecff',
    flexShrink: 0,
  },
  historyBadgeText: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '700',
  },
  historyLabel: {
    color: '#464555',
    fontSize: 13,
  },
  historyIdentifier: {
    color: '#131b2e',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
