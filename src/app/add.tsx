import { useCallback, useState, useSyncExternalStore } from 'react';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import {
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

const emptyForm = {
  name: '',
  enrollment: '',
  grade: '',
  group: '',
  guardianName: '',
  guardianPhone: '',
  secondaryGuardianName: '',
  secondaryGuardianPhone: '',
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
  const [check] = useState(() => createBraceletRegistrationCheck(uid => {
    const extra = Constants.expoConfig?.extra;
    return braceletExists(uid, extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken);
  }));
  const verification = useSyncExternalStore(check.subscribe, check.getState, check.getState);
  useFocusEffect(useCallback(() => () => { check.clear(); }, [check]));
  const captureBracelet = useCallback((uid: string) => {
    const accepted = check.scan(uid);
    if (accepted) setForm(emptyForm);
    return accepted;
  }, [check]);
  const nfc = useNfcReader(captureBracelet);
  const braceletId = verification.uid;
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
                {verification.status === 'checking' ? 'Verificando'
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
                  : verification.status === 'checking' ? 'Verificando si la pulsera existe en Supabase…'
                    : verification.status === 'exists' ? 'Esta pulsera ya está registrada. No se permite un nuevo registro; acerca otra pulsera.'
                      : verification.status === 'error' ? 'No se pudo verificar la pulsera. Comprueba la conexión y vuelve a escanear. El formulario permanece bloqueado.'
                        : verification.status === 'available' ? 'Supabase confirmó que la pulsera no existe. Puedes completar el formulario; todavía no se ha guardado ni vinculado.'
                          : 'Acerca una pulsera para comprobar si está disponible.'}
            </Text>
            {braceletId && <Text selectable style={styles.description}>Identificador: {braceletId}</Text>}
          </View>

          {verification.status === 'available' && <>
          <View style={[styles.card, styles.photoRow]}>
            <Image
              source={require('../../assets/images/student-placeholder.svg')}
              style={styles.photo}
              contentFit="cover"
              accessible={false}
            />
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.sectionTitle}>Fotografía escolar</Text>
              <Text style={styles.description}>Imagen de ejemplo. Carga de fotografía pendiente.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <FormField label="Nombre completo del alumno" placeholder="Ej. Diego Ramírez Castro" value={form.name} onChangeText={update('name')} />
            <FormField label="Matrícula" placeholder="Ej. KQ-2025-084" autoCapitalize="characters" autoCorrect={false} value={form.enrollment} onChangeText={update('enrollment')} />
            <View style={styles.fieldsRow}>
              <View style={styles.flex}>
                <FormField label="Grado" placeholder="Ej. 3° Primaria" value={form.grade} onChangeText={update('grade')} />
              </View>
              <View style={styles.flex}>
                <FormField label="Grupo" placeholder="Ej. B" autoCapitalize="characters" autoCorrect={false} value={form.group} onChangeText={update('group')} />
              </View>
            </View>

            <Text accessibilityRole="header" style={styles.sectionTitle}>Padres o tutores</Text>
            <View style={styles.guardianCard}>
              <Text style={styles.guardianTitle}>Tutor principal</Text>
              <FormField label="Nombre del tutor principal" placeholder="Nombre completo" value={form.guardianName} onChangeText={update('guardianName')} />
              <FormField label="Teléfono del tutor principal" placeholder="Número de teléfono" keyboardType="phone-pad" value={form.guardianPhone} onChangeText={update('guardianPhone')} />
            </View>
            <View style={styles.guardianCard}>
              <Text style={styles.guardianTitle}>Tutor secundario (opcional)</Text>
              <FormField label="Nombre del tutor secundario" placeholder="Nombre completo" value={form.secondaryGuardianName} onChangeText={update('secondaryGuardianName')} />
              <FormField label="Teléfono del tutor secundario" placeholder="Número de teléfono" keyboardType="phone-pad" value={form.secondaryGuardianPhone} onChangeText={update('secondaryGuardianPhone')} />
            </View>
          </View>

          <Text style={styles.description}>Base del formulario: los datos permanecen solo en esta pantalla y todavía no se guardan.</Text>
          <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.saveButton}>
            <Text style={styles.saveText}>Vincular y guardar alumno</Text>
          </Pressable>
          </>}
          {braceletId && <Pressable accessibilityRole="button" onPress={() => { setForm(emptyForm); check.clear(); }} style={styles.clearButton}>
            <Text style={styles.clearText}>Limpiar y usar otra pulsera</Text>
          </Pressable>
          }
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
  photoRow: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#eaedff' },
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
  guardianCard: { backgroundColor: '#f7f7ff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2dfff', gap: 12 },
  guardianTitle: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  saveButton: { backgroundColor: '#4f46e5', opacity: 0.45, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#ffffff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  clearButton: { padding: 12, alignItems: 'center' },
  clearText: { color: '#464555', fontSize: 14, fontWeight: '600' },
});
