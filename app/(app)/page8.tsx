import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
export default function Page8() {
  const { user } = useAuth();
  if (user?.role !== 'siswa') return <Redirect href="/" />;
  return <View className="flex-1 items-center justify-center"><Text className="text-heading">Page 8 (siswa only)</Text></View>;
}