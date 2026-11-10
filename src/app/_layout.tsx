import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
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
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
