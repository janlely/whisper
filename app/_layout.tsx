import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Net from '@/net';
import { GestureHandlerRootView, Pressable } from 'react-native-gesture-handler';
import { LogOut } from 'lucide-react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      router.replace({
        pathname: '/',
        params: { roomId: '好好学习'},
      });
    }
  }, [loaded, router]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <GluestackUIProvider mode="light">
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
              headerRight: () => (
                <Pressable onPress={() => {
                  Net.disconnect()
                  router.replace({ pathname: '/login', params: { isLogout: 'true' } })
                }}>
                  <LogOut style={{ marginRight: 10, width: 24, height: 24 }} color={'black'} />
                </Pressable>
              ),
              animation: 'default',
              headerTitleAlign: 'center',
              headerStyle: { backgroundColor: '#f5f5f5' },
              statusBarStyle: 'dark',
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" />
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
