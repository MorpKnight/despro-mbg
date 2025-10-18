import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
export default function Page3() {
  const { user } = useAuth();
  if (user?.role !== 'admin sekolah') return <Redirect href="/" />;
  return <View className="flex-1 items-center justify-center"><Text className="text-heading">Page 3 (admin sekolah only)</Text></View>;
}