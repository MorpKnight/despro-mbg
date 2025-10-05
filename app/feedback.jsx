import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = ['Makanan', 'Transportasi', 'Kontainer', 'Lainnya'];

const feedbackList = [
  { id: '1', category: 'Makanan', title: 'Kualitas Makanan Kantin', desc: 'Makanan di kantin kurang bervariasi dan tidak enak', date: '16 Jan 2025' },
  { id: '2', category: 'Transportasi', title: 'Lorem Ipsum', desc: 'Lorem ipsum dolor', date: '14 Jan 2025' },
  { id: '3', category: 'Kontainer', title: 'Tempat Sampah Penuh', desc: 'Kontainer sampah di area parkir selalu penuh', date: '13 Jan 2025' },
  { id: '4', category: 'Lainnya', title: 'WiFi Kampus Lambat', desc: 'Koneksi internet di perpustakaan sangat lambat', date: '12 Jan 2025' },
  // add the rest
];

export default function FeedbackScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold">Sistem Masukan</Text>
        <TouchableOpacity className="border px-3 py-1 rounded">
          <Text>Mahasiswa ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View className="mb-4">
        <Text className="font-semibold mb-2">Filter Kategori</Text>
        <View className="flex-row flex-wrap">
          {categories.map((cat) => (
            <TouchableOpacity key={cat} className="border rounded px-3 py-1 mr-2 mb-2">
              <Text>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity className="bg-black px-4 py-2 rounded mt-2">
          <Text className="text-white text-center">Unduh Semua</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Feedback */}
      <View className="mb-4 border rounded p-4">
        <Text className="font-semibold mb-2">Kirim Masukan</Text>

        {/* Category */}
        <View className="flex-row mb-2">
          {categories.map((cat) => (
            <TouchableOpacity key={cat} className="mr-4">
              <Text>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title Input */}
        <TextInput
          className="border rounded p-2 mb-2"
          placeholder="Masukkan judul masukan..."
        />

        {/* Description Input */}
        <TextInput
          className="border rounded p-2 mb-2 h-24"
          placeholder="Tuliskan masukan Anda..."
          multiline
        />

        <TouchableOpacity className="bg-black px-4 py-2 rounded">
          <Text className="text-white text-center">Kirim Masukan</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback List */}
      <View className="flex-1">
        <Text className="font-semibold mb-2">Masukan Teratas</Text>
        <FlatList
          data={feedbackList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="border rounded p-3 mb-2">
              <Text className="font-bold">{item.title}</Text>
              <Text className="text-gray-600">{item.desc}</Text>
              <Text className="text-sm text-gray-400">{item.date}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
