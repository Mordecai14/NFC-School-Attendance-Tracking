import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the screen's rendered content and actions without loading native modules.
// These checks do not replace visual verification on Android or iOS.
const source = readFileSync(new URL('../src/app/index.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const event = {
  id: 'event-1', student_id: 'student-1', school_id: 'school-1',
  bracelet_id: 'bracelet-1', type: 'entry', occurred_at: '2026-11-11T07:48:12Z',
};
const student = {
  id: 'student-1', school_id: 'school-1', bracelet_id: 'bracelet-1',
  first_name: 'Alumno', last_name: 'Prueba', grade: '4° Primaria', group_name: 'B',
};

function renderScreen({
  status = 'idle', lookupStatus = 'ready', detected = false, available = true,
  schoolName = null, mode = 'entry', readingMode = mode, switchOpen = false, regError = null, recent = { entry: [], exit: [] },
} = {}) {
  const actions = { retries: 0, modes: [], switchOpen: [], confirms: 0, cancels: 0 };
  const registration = {
    status, error: regError,
    confirmed: status === 'saved' ? { event, studentName: 'Alumno Prueba' } : null,
    pending: ['pending', 'saving', 'confirm'].includes(status) ? { event, studentName: 'Alumno Prueba' } : null,
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const native = Object.fromEntries([
    'ActivityIndicator', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View',
  ].map(name => [name, name]));
  native.StyleSheet = { create: value => value };
  const modules = {
    'react': { useEffect() {}, useState: () => [switchOpen, value => { actions.switchOpen.push(value); }] },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': native,
    'expo-image': { Image: 'Image' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'react-native-reanimated': {
      default: { View: 'AnimatedView' },
      cancelAnimation() {}, useReducedMotion: () => true,
      useSharedValue: value => ({ value }), useAnimatedStyle: callback => callback(),
      withRepeat() {}, withTiming() {},
    },
    '@/hooks/use-nfc-reader': {
      useNfcReader: () => ({
        availability: available ? 'available' : 'unavailable',
        current: detected ? { status: 'detected', identifier: '04:A3:89' } : { status: 'waiting' },
      }),
    },
    '@/hooks/use-school-name': { useSchoolName: () => schoolName },
    '@/hooks/use-attendance-registration': {
      useAttendanceRegistration: () => ({ state: registration, retry() { actions.retries += 1; } }),
    },
    '@/hooks/use-attendance-scanner': {
      useAttendanceScanner: () => ({
        state: {
          status: lookupStatus, mode, readingMode, recent,
          student: ['identified', 'duplicate'].includes(lookupStatus) ? student : null,
        },
        scan() {}, selectMode(mode) { actions.modes.push(mode); }, async retry() { actions.retries += 1; },
        async confirmRepeat() { actions.confirms += 1; }, async cancelRepeat() { actions.cancels += 1; },
      }),
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require(name) {
      if (name.endsWith('student-placeholder.svg')) return 'dummy-avatar';
      assert.ok(name in modules, `Unexpected screen dependency: ${name}`);
      return modules[name];
    },
  });
  function flatten(node) {
    if (Array.isArray(node)) return node.flatMap(flatten);
    if (node == null || typeof node === 'boolean') return [];
    if (typeof node !== 'object') return [String(node)];
    if (typeof node.type === 'function') return flatten(node.type(node.props));
    if (node.type === 'Modal' && !node.props.visible) return [node];
    return [node, ...flatten(node.props.children)];
  }
  const nodes = flatten(module.exports.default());
  return { nodes, text: nodes.filter(node => typeof node === 'string').join(' '), actions };
}

test('a confirmed movement uses one hero card with a dummy photo and its real time', () => {
  const { nodes, text } = renderScreen({ status: 'saved', lookupStatus: 'identified', detected: true });
  assert.match(text, /Último registro confirmado/);
  assert.match(text, /Alumno Prueba/);
  assert.ok(text.includes(new Date(event.occurred_at).toLocaleTimeString()));
  assert.doesNotMatch(text, /Última pulsera detectada/);
  assert.equal(nodes.filter(node => node.type === 'Image').length, 1);
});

test('the idle sensor invites scanning without inventing confirmed attendance', () => {
  const { text } = renderScreen();
  assert.match(text, /Acerca la pulsera al dispositivo/);
  assert.doesNotMatch(text, /Último registro confirmado/);
  assert.match(text, /Todavía no hay lecturas/);
});

test('pending attendance keeps retry and the mode selection locked', () => {
  const { nodes, text, actions } = renderScreen({ status: 'pending', lookupStatus: 'identified', detected: true });
  assert.match(text, /Registro pendiente de confirmación/);
  assert.match(text, /No se confirmó el guardado/);
  assert.doesNotMatch(text, /Último registro confirmado/);
  const change = nodes.find(node => node.props?.accessibilityLabel === 'Cambiar a SALIDA');
  assert.equal(change.props.disabled, true);
  nodes.find(node => node.type === 'Pressable' && node.props.accessibilityRole === 'button' && !node.props.accessibilityLabel).props.onPress();
  assert.equal(actions.retries, 1);
});

test('an unknown bracelet remains visible and cannot look like a saved movement', () => {
  const { text } = renderScreen({ detected: true, lookupStatus: 'unknown' });
  assert.match(text, /No hay un alumno activo asignado a esta pulsera/);
  assert.match(text, /04:A3:89/);
  assert.doesNotMatch(text, /Último registro confirmado/);
});

test('there is no "Sin registros todavía" box and no inline entry/exit radios', () => {
  const { nodes, text } = renderScreen();
  assert.doesNotMatch(text, /Sin registros todavía/);
  assert.equal(nodes.filter(node => node.props?.accessibilityRole === 'radio').length, 0);
});

test('changing mode requires opening the modal and confirming; cancel changes nothing', () => {
  const closed = renderScreen();
  const open = closed.nodes.find(node => node.props?.accessibilityLabel === 'Cambiar a SALIDA');
  assert.equal(open.props.disabled, false);
  assert.doesNotMatch(closed.text, /¿Cambiar a\s+SALIDA\s*\?/);
  open.props.onPress();
  assert.deepEqual(closed.actions.switchOpen, [true]);
  assert.deepEqual(closed.actions.modes, []);

  const modal = renderScreen({ switchOpen: true });
  assert.match(modal.text, /¿Cambiar a\s+SALIDA\s*\?/);
  const button = label => modal.nodes.find(node => node.type === 'Pressable' &&
    flattenText(node).includes(label));
  function flattenText(node) {
    const kids = [node.props.children].flat(Infinity).filter(x => x != null);
    return kids.map(k => typeof k === 'object' ? flattenText(k) : String(k)).join('');
  }
  button('Cancelar').props.onPress();
  assert.deepEqual(modal.actions.modes, []);
  button('Confirmar').props.onPress();
  assert.deepEqual(modal.actions.modes, ['exit']);
  assert.deepEqual(modal.actions.switchOpen, [false, false]);
});

test('each mode shows its own view and its students, never the bracelet UUID', () => {
  const movement = (id, first_name, type) => ({
    id, occurred_at: event.occurred_at, student: { ...student, first_name, last_name: type, grade: '5°', group_name: 'C' },
  });
  const recent = { entry: [movement('e1', 'Ana', 'Entrada')], exit: [movement('x1', 'Beto', 'Salida'), movement('x2', 'Carla', 'Salida')] };
  const entry = renderScreen({ mode: 'entry', recent, detected: true });
  const exit = renderScreen({ mode: 'exit', recent });
  assert.match(entry.text, /Entradas/);
  assert.match(entry.text, /Ana\s+Entrada/);
  assert.match(entry.text, /5°\s+·\s+C/);
  assert.doesNotMatch(entry.text, /Beto/);
  assert.match(exit.text, /Salidas/);
  assert.match(exit.text, /Beto/);
  assert.match(exit.text, /Carla/);
  assert.doesNotMatch(exit.text, /Ana/);
  const list = entry.text.slice(entry.text.indexOf('Lecturas de entradas'));
  assert.doesNotMatch(list, /04:A3:89/);
  assert.ok(exit.nodes.some(node => node.props?.accessibilityLabel === 'Cambiar a ENTRADA'));
  assert.match(renderScreen({ available: false }).text, /NFC no disponible/);
});

test('loading, saving and blocked states retain their warnings without claiming confirmation', () => {
  for (const [status, message] of [
    ['loading', 'Comprobando registros pendientes'],
    ['saving', 'Guardando asistencia'],
    ['blocked', 'No se pudo recuperar el almacenamiento local'],
  ]) {
    const { text } = renderScreen({ status });
    assert.ok(text.includes(message));
    assert.doesNotMatch(text, /Último registro confirmado/);
  }
});

test('lookup failure and duplicate confirmation retain their recovery instructions', () => {
  assert.match(renderScreen({ detected: true, lookupStatus: 'error' }).text, /No se pudo consultar el alumno/);
  assert.match(
    renderScreen({ status: 'saved', detected: true, lookupStatus: 'duplicate' }).text,
    /No se guardó otro registro/,
  );
});

test('switching mode hides the other mode\'s last confirmation and detected bracelet', () => {
  const entry = renderScreen({ status: 'saved', lookupStatus: 'identified', detected: true, mode: 'entry' });
  assert.match(entry.text, /Último registro confirmado/);

  const exit = renderScreen({
    status: 'saved', lookupStatus: 'identified', detected: true, mode: 'exit', readingMode: 'entry',
  });
  assert.doesNotMatch(exit.text, /Último registro confirmado/);
  assert.doesNotMatch(exit.text, /Alumno Prueba/);
  assert.doesNotMatch(exit.text, /Última pulsera detectada|04:A3:89 /);
  assert.match(exit.text, /Acerca la pulsera al dispositivo/);
  assert.match(exit.text, /Salidas/);
});

test('the server asks for confirmation through a modal; Confirmar and Cancelar call the scanner', () => {
  const open = renderScreen({ status: 'confirm', lookupStatus: 'identified', detected: true });
  assert.match(open.text, /¿Registrar otra\s+entrada\s*\?/);
  assert.match(open.text, /Alumno Prueba\s+ya tiene movimientos registrados hoy/);
  const press = label => open.nodes.find(node => node.type === 'Pressable' &&
    [node.props.children].flat(Infinity).some(child => child?.props?.children === label));
  press('Confirmar').props.onPress();
  press('Cancelar').props.onPress();
  assert.equal(open.actions.confirms, 1);
  assert.equal(open.actions.cancels, 1);
  assert.doesNotMatch(renderScreen({ status: 'saved', lookupStatus: 'identified', detected: true }).text, /¿Registrar otra/);
});

test('a duplicate rejection is explained without an alarming empty registration card', () => {
  const { text } = renderScreen({ detected: true, lookupStatus: 'duplicate', regError: 'duplicate' });
  assert.match(text, /Entrada ya registrada/);
  assert.match(text, /Alumno Prueba\s+ya tiene\s+una entrada/);
  assert.match(text, /No se guardó otra/);
  assert.doesNotMatch(text, /No se puede registrar todavía/);
  // Prominent: an assertive alert, not small print inside another card.
  const alert = renderScreen({ detected: true, lookupStatus: 'duplicate' }).nodes.find(node => node.props?.accessibilityRole === 'alert');
  assert.equal(alert.props.accessibilityLiveRegion, 'assertive');
  // Also visible when the rejection arrives from a retry, with no scanner duplicate status.
  assert.match(renderScreen({ regError: 'duplicate' }).text, /Entrada ya registrada/);
  assert.match(renderScreen({ regError: 'duplicate', mode: 'exit', readingMode: 'exit' }).text, /Salida ya registrada/);
  // It does not leak into the other mode, nor appear without a duplicate.
  assert.doesNotMatch(renderScreen({ lookupStatus: 'duplicate', mode: 'exit', readingMode: 'entry' }).text, /ya registrada/);
  assert.doesNotMatch(renderScreen().text, /ya registrada/);
});

test('the header shows the school name and falls back to the neutral title while it is unknown', () => {
  const named = renderScreen({ schoolName: 'Colegio Fixture' });
  assert.match(named.text, /Colegio Fixture/);
  assert.doesNotMatch(named.text, /Escaneo NFC/);
  assert.match(renderScreen().text, /Escaneo NFC/);
});
