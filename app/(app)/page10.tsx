import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
export default function Page10() {
  const { user } = useAuth();
  if (user?.role !== 'admin dinkes') return <Redirect href="/" />;
  return <View className="flex-1 items-center justify-center"><Text className="text-heading">Page 10 (admin dinkes only)</Text></View>;
}