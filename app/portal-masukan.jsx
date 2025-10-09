import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";

export default function PortalMasukan() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!selectedCategory || !title || !description) {
      Alert.alert("Error", "Mohon lengkapi semua field");
      return;
    }
    Alert.alert("Berhasil", "Masukan berhasil dikirim!");
    setTitle("");
    setDescription("");
    setSelectedCategory("");
  };

  const handleDownload = () => {
    Alert.alert("Download", "Mengunduh semua masukan...");
  };

  const categories = [
    { id: "makanan", label: "Makanan" },
    { id: "transportasi", label: "Transportasi" },
    { id: "kontainer", label: "Kontainer" },
    { id: "lainnya", label: "Lainnya" }
  ];

  const masukanData = [
    {
      id: "#001",
      title: "Kualitas Makanan",
      category: "Makanan",
      time: "2 hari yang lalu",
      description: "Perlu peningkatan kualitas makanan terutama nasi"
    },
    {
      id: "#002", 
      title: "Jadwal Pengiriman",
      category: "Transportasi",
      time: "3 hari yang lalu",
      description: "Mohon diperbaiki jadwal bus yang sering terlambat..."
    },
    {
      id: "#003",
      title: "Lorem Ipsum",
      category: "Kontainer", 
      time: "1 minggu yang lalu",
      description: "Lorem ipsum dolor sit amet"
    },
    {
      id: "#004",
      title: "Lorem Ipsum",
      category: "Lainnya",
      time: "1 minggu yang lalu", 
      description: "Lorem ipsum dolor sit amet"
    },
    {
      id: "#005",
      title: "Lorem Ipsum",
      category: "Transportasi",
      time: "2 minggu yang lalu",
      description: "Lorem ipsum dolor sit amet"
    }
  ];

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center justify-between sticky top-0 z-10">
        <View className="w-6 h-6 flex-col justify-around">
          <View className="w-full h-0.5 bg-gray-800 rounded-sm" />
          <View className="w-full h-0.5 bg-gray-800 rounded-sm" />
          <View className="w-full h-0.5 bg-gray-800 rounded-sm" />
        </View>
        <Text className="text-lg font-semibold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
          Portal Masukan
        </Text>
      </View>

      <View className="max-w-sm mx-auto p-5">
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <Text className="text-xl font-semibold mb-5 text-gray-800">Kirim Masukan</Text>
          
          <View className="mb-5">
            <Text className="block mb-3 font-medium text-gray-600">Kategori Masukan</Text>
            <View className="flex-col gap-3">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className="flex-row items-center gap-2"
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View className={`w-4 h-4 rounded-full border-2 ${
                    selectedCategory === category.id ? 'bg-gray-800 border-gray-800' : 'border-gray-300'
                  }`}>
                    {selectedCategory === category.id && (
                      <View className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </View>
                  <Text className="text-gray-800">{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-5">
            <Text className="block mb-3 font-medium text-gray-600">Judul Masukan</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 focus:border-gray-800 focus:bg-white"
              placeholder="Masukkan judul singkat..."
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="mb-5">
            <Text className="block mb-3 font-medium text-gray-600">Deskripsi</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-gray-50 min-h-24 focus:border-gray-800 focus:bg-white"
              placeholder="Tuliskan masukan Anda secara detail..."
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            className="w-full py-4 rounded-lg"
            style={{ backgroundColor: '#1976D2' }}
            onPress={handleSubmit}
          >
            <Text className="text-white text-base font-semibold text-center">Kirim Masukan</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-xl font-semibold text-gray-800">Semua Masukan</Text>
          <TouchableOpacity
            className="px-4 py-2 rounded-md flex-row items-center gap-1.5"
            style={{ backgroundColor: '#1976D2' }}
            onPress={handleDownload}
          >
            <Text className="text-white text-sm">⬇</Text>
            <Text className="text-white text-sm">Unduh Semua</Text>
          </TouchableOpacity>
        </View>

        {masukanData.map((item) => (
          <View key={item.id} className="bg-white rounded-lg p-4 mb-3 border border-gray-200 relative">
            <Text className="absolute top-4 right-4 text-xs text-gray-400 font-medium">
              {item.id}
            </Text>
            <View className="flex-row items-start gap-3 mb-2">
              <View className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-0.5" />
              <View className="flex-1">
                <Text className="font-semibold text-base text-gray-800 mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                  {item.category} • {item.time}
                </Text>
                <Text className="text-sm text-gray-600 leading-5">
                  {item.description}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View className="flex-row justify-center items-center gap-2 my-8">
          <TouchableOpacity className="w-10 h-10 border-none rounded-lg bg-white text-gray-600 flex items-center justify-center">
            <Text className="text-lg">‹</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 border-none rounded-lg bg-gray-800 text-white flex items-center justify-center">
            <Text className="text-sm font-medium">1</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 border-none rounded-lg bg-white text-gray-600 flex items-center justify-center">
            <Text className="text-sm font-medium">2</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 border-none rounded-lg bg-white text-gray-600 flex items-center justify-center">
            <Text className="text-sm font-medium">3</Text>
          </TouchableOpacity>
          <Text className="text-gray-400">...</Text>
          <TouchableOpacity className="w-10 h-10 border-none rounded-lg bg-white text-gray-600 flex items-center justify-center">
            <Text className="text-sm font-medium">10</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 border-none rounded-lg bg-white text-gray-600 flex items-center justify-center">
            <Text className="text-lg">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="items-center py-6">
        <Text className="text-gray-400 text-sm text-center">© 2025 Portal Masukan Kampus</Text>
      </View>
    </ScrollView>
  );
}
