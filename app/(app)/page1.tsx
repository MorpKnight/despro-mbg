import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
export default function Page1() {
  const { user } = useAuth();
  if (user?.role !== 'super admin') return <Redirect href="/" />;
  return <View className="flex-1 items-center justify-center"><Text className="text-heading">Page 1 (super admin only)</Text></View>;
}