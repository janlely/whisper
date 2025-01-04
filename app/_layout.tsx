import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      router.push('/login');
    }
  }, [loaded, router]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <GluestackUIProvider mode="light">
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack initialRouteName='login'>
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="imageviewer"
              options={{
                headerShown: false,
                statusBarHidden: true,
                // statusBarTranslucent: true,
                animation: 'fade',
                // headerTitleAlign: 'center',
                headerStyle: { backgroundColor: '#f5f5f5' },
              }}
            />
            <Stack.Screen
              name="index"
              options={{
                headerShown: true,
                animation: 'default',
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: '#f5f5f5' },
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
