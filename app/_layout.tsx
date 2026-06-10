import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookingProvider } from '@/contexts/BookingContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <BookingProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#080C1A' },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="booking" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="tracking/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="review/[id]" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
          </BookingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
