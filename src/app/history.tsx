import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAttendanceHistory } from '@/hooks/use-attendance-history';
import {
  SCHOOL_TIME_ZONE,
  countByType,
  filterRecords,
  type HistoryDay,
  type HistoryRecord,
  type HistoryTypeFilter,
} from '@/services/attendance-history';

const TYPE_VIEW = {
  entry: { label: 'Entrada', color: '#047857', background: '#d1fae5' },
  exit: { label: 'Salida', color: '#b45309', background: '#fef3c7' },
} as const;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    timeZone: SCHOOL_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function initials(record: HistoryRecord): string {
  return `${record.first_name.charAt(0)}${record.last_name.charAt(0)}`.toUpperCase();
}

function classroom(record: HistoryRecord): string {
  return [record.grade, record.group_name].filter(Boolean).join(' ') || 'Sin grupo';
}

export default function HistoryScreen() {
  const [day, setDay] = useState<HistoryDay>('today');
  const [type, setType] = useState<HistoryTypeFilter>('all');
  const [query, setQuery] = useState('');
  const { records, status, refreshing, refresh, retry } = useAttendanceHistory(day);

  const counts = useMemo(() => countByType(records), [records]);
  const visible = useMemo(() => filterRecords(records, type, query), [records, type, query]);

  const chips: { value: HistoryTypeFilter; label: string }[] = [
    { value: 'all', label: `Todos (${records.length})` },
    { value: 'entry', label: `Entradas (${counts.entry})` },
    { value: 'exit', label: `Salidas (${counts.exit})` },
  ];

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{day === 'today' ? 'RESUMEN DE HOY' : 'RESUMEN DE AYER'}</Text>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryValue}>{counts.entry}</Text>
            <Text style={styles.summaryCaption}>Entradas</Text>
          </View>
          <View>
            <Text style={styles.summaryValue}>{counts.exit}</Text>
            <Text style={styles.summaryCaption}>Salidas</Text>
          </View>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar alumno…"
        placeholderTextColor="#8a93a3"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Buscar alumno"
      />

      <View style={styles.filters}>
        <View style={styles.chipRow}>
          {chips.map(chip => (
            <Pressable
              key={chip.value}
              onPress={() => setType(chip.value)}
              style={[styles.chip, type === chip.value && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: type === chip.value }}>
              <Text style={[styles.chipText, type === chip.value && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.segmented}>
          {(['today', 'yesterday'] as const).map(value => (
            <Pressable
              key={value}
              onPress={() => setDay(value)}
              style={[styles.segment, day === value && styles.segmentActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: day === value }}>
              <Text style={[styles.segmentText, day === value && styles.segmentTextActive]}>
                {value === 'today' ? 'Hoy' : 'Ayer'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>REGISTROS RECIENTES</Text>
        {status === 'ready' ? <Text style={styles.listTotal}>Total: {visible.length} registros</Text> : null}
      </View>
    </View>
  );

  const empty = status === 'loading' ? (
    <ActivityIndicator style={styles.state} color="#4f46e5" />
  ) : status === 'error' ? (
    <View style={styles.state}>
      <Text style={styles.stateText}>No se pudo cargar el historial.</Text>
      <Pressable onPress={retry} style={styles.retry} accessibilityRole="button">
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  ) : (
    <Text style={[styles.state, styles.stateText]}>
      {records.length === 0 ? 'Sin registros en este día.' : 'Ningún registro coincide con el filtro.'}
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Registros de entradas y salidas</Text>
      </View>
      <FlatList
        data={status === 'ready' ? visible : []}
        keyExtractor={record => record.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4f46e5" />}
        renderItem={({ item }) => {
          const view = TYPE_VIEW[item.type];
          return (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item)}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.name} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.classroom} numberOfLines={1}>{classroom(item)}</Text>
              </View>
              <View style={styles.rowTime}>
                <Text style={styles.time}>{formatTime(item.occurred_at)}</Text>
                <View style={[styles.badge, { backgroundColor: view.background }]}>
                  <Text style={[styles.badgeText, { color: view.color }]}>{view.label}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fd' },
  titleBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 2 },
  title: { color: '#4f46e5', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#657384', fontSize: 13 },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  headerContent: { gap: 14, paddingBottom: 4 },
  summaryCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, gap: 10 },
  summaryLabel: { color: '#344454', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', gap: 48 },
  summaryValue: { color: '#4f46e5', fontSize: 34, fontWeight: '700' },
  summaryCaption: { color: '#344454', fontSize: 14 },
  search: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#c9ced9',
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#17212b',
  },
  filters: { gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#4f46e5' },
  chipText: { color: '#344454', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
  segmented: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#ebebf8', borderRadius: 999, padding: 3 },
  segment: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 6 },
  segmentActive: { backgroundColor: '#ffffff' },
  segmentText: { color: '#657384', fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: '#4f46e5' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { color: '#344454', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  listTotal: { color: '#657384', fontSize: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff',
    borderRadius: 16, padding: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e0fa',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#4f46e5', fontSize: 16, fontWeight: '700' },
  rowInfo: { flex: 1, gap: 2 },
  name: { color: '#17212b', fontSize: 16, fontWeight: '700' },
  classroom: { color: '#657384', fontSize: 13 },
  rowTime: { alignItems: 'flex-end', gap: 4 },
  time: { color: '#4f46e5', fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  state: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  stateText: { color: '#657384', fontSize: 15, textAlign: 'center' },
  retry: { backgroundColor: '#4f46e5', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#ffffff', fontWeight: '700' },
});
