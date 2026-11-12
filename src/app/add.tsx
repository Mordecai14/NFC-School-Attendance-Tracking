import { useCallback, useState, useSyncExternalStore } from 'react';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNfcReader } from '@/hooks/use-nfc-reader';
import { developmentAuth } from '@/hooks/use-development-login';
import { braceletExists, createBraceletRegistrationCheck } from '@/services/bracelet-registration-check';
import { useStudentRegistration } from '@/hooks/use-student-registration';
import type { StudentDraft } from '@/services/student-registration';

const emptyForm: StudentDraft = {
  first_name: '',
  last_name: '',
  student_number: '',
  grade: '',
  group_name: '',
};

function FormField({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#777587"
        autoCapitalize="words"
        {...props}
        style={styles.input}
      />
    </View>
  );
}

export default function RegisterStudentScreen() {
  const [form, setForm] = useState(emptyForm);
  const { state: registration, getState, register, retry, clear } = useStudentRegistration();
  const [check] = useState(() => createBraceletRegistrationCheck(uid => {
    const extra = Constants.expoConfig?.extra;
    return braceletExists(uid, extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken);
  }));
  const verification = useSyncExternalStore(check.subscribe, check.getState, check.getState);
  useFocusEffect(useCallback(() => () => { check.clear(); }, [check]));
  const captureBracelet = useCallback((uid: string) => {
    if (!['idle', 'rejected'].includes(getState().status)) return false;
    const accepted = check.scan(uid);
    if (accepted) setForm(emptyForm);
    return accepted;
  }, [check, getState]);
  const nfc = useNfcReader(captureBracelet);
  const braceletId = registration.attempt?.bracelet_uid ?? verification.uid;
  const showForm = verification.status === 'available' &&
    ['idle', 'rejected'].includes(registration.status) && registration.error !== 'conflict';
  const saving = ['preparing', 'saving'].includes(registration.status);
  const canClear = ['idle', 'saved', 'rejected'].includes(registration.status);
  const startAnother = () => {
    if (!clear()) return;
    setForm(emptyForm);
    check.clear();
  };
  const update = (field: keyof typeof emptyForm) => (value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>EXPEDIENTE NUEVO</Text>
            <Text accessibilityRole="header" style={styles.title}>Vincular alumno</Text>
            <Text style={styles.description}>Primero escanea una pulsera. Si no está registrada, podrás completar los datos.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <Text style={styles.sectionTitle}>Pulsera NFC</Text>
              <Text style={styles.pendingBadge}>
                {registration.status === 'saved' ? 'Vinculada'
                  : registration.status === 'pending' ? 'Por confirmar'
                    : saving ? 'Guardando'
                      : registration.error === 'conflict' ? 'Conflicto'
                        : verification.status === 'checking' ? 'Verificando'
                          : verification.status === 'exists' ? 'Ya registrada'
                            : verification.status === 'available' ? 'Disponible'
                              : verification.status === 'error' ? 'Sin verificar' : 'Pendiente'}
              </Text>
            </View>
            <Text style={styles.description} accessibilityLiveRegion="polite">
              {nfc.availability === 'unavailable'
                ? 'NFC no disponible. Activa NFC para leer una pulsera.'
                : nfc.current.status === 'error'
                  ? nfc.current.message
                  : registration.status === 'saved' ? 'Alumno guardado y pulsera vinculada. Ya puedes utilizarla en Escaneo NFC.'
                    : registration.status === 'pending' ? 'Hay un alta pendiente de confirmación. Reintenta el mismo guardado antes de registrar otro alumno.'
                      : saving ? 'Guardando alumno y vinculando su pulsera…'
                        : verification.status === 'checking' ? 'Verificando si la pulsera existe en Supabase…'
                    : verification.status === 'exists' ? 'Esta pulsera ya está registrada. No se permite un nuevo registro; acerca otra pulsera.'
                      : verification.status === 'error' ? 'No se pudo verificar la pulsera. Comprueba la conexión y vuelve a escanear. El formulario permanece bloqueado.'
                        : verification.status === 'available' ? 'La pulsera está disponible. Completa los datos y confirma el guardado.'
                          : 'Acerca una pulsera para comprobar si está disponible.'}
            </Text>
            {braceletId && <Text selectable style={styles.description}>Identificador: {braceletId}</Text>}
          </View>

          {showForm && (
            <>
              <View style={styles.card}>
                <FormField label="Nombre(s) del alumno *" maxLength={100} placeholder="Ej. Diego" value={form.first_name} onChangeText={update('first_name')} />
                <FormField label="Apellidos del alumno *" maxLength={100} placeholder="Ej. Ramírez Castro" value={form.last_name} onChangeText={update('last_name')} />
                <FormField label="Matrícula (opcional)" maxLength={60} placeholder="Ej. KQ-2025-084" autoCapitalize="characters" autoCorrect={false} value={form.student_number} onChangeText={update('student_number')} />
                <View style={styles.fieldsRow}>
                  <View style={styles.flex}>
                    <FormField label="Grado (opcional)" maxLength={40} placeholder="Ej. 3° Primaria" value={form.grade} onChangeText={update('grade')} />
                  </View>
                  <View style={styles.flex}>
                    <FormField label="Grupo (opcional)" maxLength={40} placeholder="Ej. B" autoCapitalize="characters" autoCorrect={false} value={form.group_name} onChangeText={update('group_name')} />
                  </View>
                </View>
                <Text style={styles.description}>* Campos obligatorios. Por ahora solo se guardan los datos del alumno y su pulsera.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !form.first_name.trim() || !form.last_name.trim() }}
                disabled={!form.first_name.trim() || !form.last_name.trim()}
                onPress={() => { if (verification.uid) void register(form, verification.uid); }}
                style={[styles.saveButton, (!form.first_name.trim() || !form.last_name.trim()) && styles.disabledButton]}
              >
                <Text style={styles.saveText}>Vincular y guardar alumno</Text>
              </Pressable>
            </>
          )}

          {(registration.status !== 'idle' || registration.error) && (
            <View style={styles.card} accessibilityLiveRegion="polite">
              <Text style={styles.sectionTitle}>
                {registration.status === 'saved' ? 'Alumno registrado'
                  : registration.status === 'pending' ? 'Alta pendiente de confirmación'
                    : registration.status === 'loading' ? 'Comprobando altas pendientes'
                      : saving ? 'Guardando alumno…' : 'No se completó el alta'}
              </Text>
              {registration.attempt && <Text style={styles.description}>
                {registration.attempt.first_name} {registration.attempt.last_name}
              </Text>}
              {(saving || registration.status === 'loading') && <ActivityIndicator color="#4f46e5" />}
              {registration.status === 'saved' && <Text style={styles.description}>Supabase confirmó el alumno y la pulsera en la misma operación.</Text>}
              {registration.status === 'pending' && (
                <>
                  <Text style={styles.description}>Se conserva el mismo intento. No borres los datos de la app. Al reintentar no se creará otro alumno.</Text>
                  <Pressable accessibilityRole="button" onPress={() => { void retry(); }} style={styles.saveButton}>
                    <Text style={styles.saveText}>Reintentar guardado</Text>
                  </Pressable>
                </>
              )}
              {registration.error && <Text style={styles.description}>
                {registration.error === 'conflict' ? 'La pulsera ya fue registrada o el intento tiene un conflicto. No se creó un alumno adicional; inicia otra alta con una pulsera nueva.'
                  : registration.error === 'invalid' ? 'Revisa los nombres, apellidos y la longitud de los datos.'
                    : registration.error === 'forbidden' ? 'La sesión no tiene permiso para confirmar esta alta. Recupera el acceso escolar antes de reintentar.'
                      : registration.error === 'prepare' ? 'No se envió el alta. Comprueba la sesión y que la cuenta tenga una única escuela autorizada.'
                        : registration.error === 'storage' ? 'No se pudo completar el almacenamiento local. Conserva los datos de la app y reintenta; si el problema persiste, solicita ayuda.'
                          : 'No se confirmó el guardado. Comprueba la conexión y reintenta el mismo intento.'}
              </Text>}
              {registration.status === 'blocked' && <Text style={styles.description}>No se pudo recuperar el alta pendiente. No borres los datos de la app; solicita ayuda para recuperarlos.</Text>}
            </View>
          )}
          {canClear && (braceletId || registration.status === 'saved') && (
            <Pressable accessibilityRole="button" onPress={startAnother} style={styles.clearButton}>
              <Text style={styles.clearText}>{registration.status === 'saved' ? 'Registrar otro alumno' : 'Limpiar y usar otra pulsera'}</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#faf8ff' },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heading: { gap: 8 },
  eyebrow: { color: '#4f46e5', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#4f46e5', fontSize: 28, fontWeight: '700' },
  description: { color: '#464555', fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eeedf4',
    padding: 20,
    gap: 16,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  sectionTitle: { color: '#131b2e', fontSize: 17, fontWeight: '600' },
  pendingBadge: { color: '#4f46e5', backgroundColor: '#eeecff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, fontSize: 12 },
  field: { gap: 8, minWidth: 0 },
  label: { color: '#464555', fontSize: 12, fontWeight: '600' },
  input: {
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7c4d8',
    backgroundColor: '#f2f3ff',
    color: '#131b2e',
    fontSize: 15,
  },
  fieldsRow: { flexDirection: 'row', gap: 12 },
  saveButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.45 },
  saveText: { color: '#ffffff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  clearButton: { padding: 12, alignItems: 'center' },
  clearText: { color: '#464555', fontSize: 14, fontWeight: '600' },
});
