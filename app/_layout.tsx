import { Stack } from "expo-router";
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider } from "../context/AuthContext";
import { OfflineProvider } from "../context/OfflineContext";
import "../global.css";
import { suppressWebWarnings } from "../utils/debug-web-warnings";

export default function RootLayout() {
  if (process.env.NODE_ENV === 'development') {
    suppressWebWarnings();
  }
  return (
    <AuthProvider>
      <OfflineProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </OfflineProvider>
    </AuthProvider>
  );
}
