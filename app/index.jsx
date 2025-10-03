import { View, Text } from "react-native";
import "expo-router/entry";
import "../global.css";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-red-500">
      <Text className="text-4xl font-extrabold text-yellow-300 underline">
        🚀 NativeWind Test
      </Text>
    </View>
  );
}
