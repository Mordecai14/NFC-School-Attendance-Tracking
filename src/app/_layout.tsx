import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { useDevelopmentLogin } from '@/hooks/use-development-login';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useDevelopmentLogin();
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View
        onLayout={() => {
          void SplashScreen.hideAsync().catch(() => undefined);
        }}
        style={styles.container}
      >
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf="wave.3.right" md="contactless" />
            <NativeTabs.Trigger.Label>Escaneo NFC</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="history">
            <NativeTabs.Trigger.Icon sf="clock" md="history" />
            <NativeTabs.Trigger.Label>Historial</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="add">
            <NativeTabs.Trigger.Icon sf="person.badge.plus" md="person_add" />
            <NativeTabs.Trigger.Label>Registro</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
