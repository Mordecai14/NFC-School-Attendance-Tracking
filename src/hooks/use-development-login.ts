import { useEffect } from 'react';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

import { createDevelopmentAuth } from '@/services/development-auth';

const extra = Constants.expoConfig?.extra;
const login = extra?.developmentLogin;
export const developmentAuth = createDevelopmentAuth({
  enabled: __DEV__ && login?.enabled === true,
  url: extra?.supabaseUrl,
  publicKey: extra?.supabasePublishableKey,
  email: login?.email,
  password: login?.password,
});
let successNotified = false;

export function useDevelopmentLogin() {
  useEffect(() => {
    if (!__DEV__ || login?.enabled !== true) return;
    let active = true;
    const start = () => {
      void developmentAuth.signIn().then(() => {
        if (!active || successNotified) return;
        successNotified = true;
        Alert.alert('Sesión iniciada', 'La cuenta escolar de pruebas está autenticada.');
      }).catch(() => {
        if (!active) return;
        Alert.alert(
          'No se pudo iniciar sesión',
          'Comprueba la conexión y la configuración local de la cuenta de pruebas.',
          [{ text: 'Cerrar', style: 'cancel' }, { text: 'Reintentar', onPress: start }],
        );
      });
    };
    start();
    return () => { active = false; };
  }, []);
}
