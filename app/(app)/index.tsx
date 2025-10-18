import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AppHome() {
  return (
    <View className="flex-1 bg-neutral-gray p-4 gap-4">
      <Card>
        <Text className="text-heading font-semibold">Home</Text>
        <Text className="text-body text-gray-700">Start building MBG Review & Track</Text>
      </Card>
      <Link href="/settings" asChild>
        <Button title="Open Settings" />
      </Link>
    </View>
  );
}
