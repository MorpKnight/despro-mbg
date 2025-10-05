import { View, Text } from "react-native";
import {Link} from "expo-router";

import "expo-router/entry";
import "../global.css";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-red-500">
      <Text className="text-4xl font-extrabold text-yellow-300 underline">
        🚀 Temporary Home Page
      </Text>
      <Text className="text-2xl font-bold text-blue-200">Click Below to Navigate to Other Pages</Text>
      <Link href="/feedback"> Feedback Page</Link>
    </View>
  );
}
