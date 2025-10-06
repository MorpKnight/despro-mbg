import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = ['Makanan', 'Transportasi', 'Kontainer', 'Lainnya'];

const feedbackList = [
  { id: '1', category: 'Makanan', title: 'Kualitas Makanan Kantin', desc: 'Makanan di kantin kurang bervariasi dan tidak enak', date: '16 Jan 2025' },
  { id: '2', category: 'Transportasi', title: 'Lorem Ipsum', desc: 'Lorem ipsum dolor', date: '14 Jan 2025' },
  { id: '3', category: 'Kontainer', title: 'Tempat Sampah Penuh', desc: 'Kontainer sampah di area parkir selalu penuh', date: '13 Jan 2025' },
  { id: '4', category: 'Lainnya', title: 'WiFi Kampus Lambat', desc: 'Koneksi internet di perpustakaan sangat lambat', date: '12 Jan 2025' },
];

export default function FeedbackScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutralGray">
      <ScrollView
        className="px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-title font-bold text-primary">Sistem Masukan</Text>
          <TouchableOpacity className="border border-secondary px-3 py-1.5 rounded-xl bg-neutralWhite shadow-sm">
            <Text className="text-secondary font-regular">Mahasiswa ▼</Text>
          </TouchableOpacity>
        </View>

        {/* Filter */}
        <View className="bg-neutralWhite rounded-2xl shadow p-4 mb-6">
          <Text className="text-heading font-semibold text-primary mb-3">Filter Kategori</Text>
          <View className="flex-row flex-wrap">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                className="border border-secondary bg-neutralGray/30 rounded-xl px-3 py-1.5 mr-2 mb-2"
              >
                <Text className="text-secondary font-medium">{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity className="bg-secondary px-4 py-2.5 rounded-xl mt-3 shadow-sm">
            <Text className="text-neutralWhite text-center font-semibold">Unduh Semua</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Feedback */}
        <View className="bg-neutralWhite rounded-2xl shadow p-4 mb-6">
          <Text className="text-heading font-semibold text-primary mb-3">Kirim Masukan</Text>

          {/* Category Selection */}
          <View className="bg-neutralGray/20 rounded-xl p-3 mb-3">
            <Text className="text-sm text-gray-600 mb-2">Pilih Kategori:</Text>
            <View className="flex-row flex-wrap">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  className="bg-neutralWhite border border-secondary/60 rounded-xl px-3 py-1.5 mr-2 mb-2 shadow-sm"
                >
                  <Text className="text-secondary font-medium">{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <TextInput
            className="border border-neutralGray rounded-xl p-3 mb-3 text-body font-regular bg-neutralGray/20"
            placeholder="Masukkan judul masukan..."
            placeholderTextColor="#888"
          />

          {/* Description Input */}
          <TextInput
            className="border border-neutralGray rounded-xl p-3 mb-3 h-28 text-body font-regular bg-neutralGray/20"
            placeholder="Tuliskan masukan Anda..."
            placeholderTextColor="#888"
            multiline
          />

          <TouchableOpacity className="bg-primary px-4 py-3 rounded-xl shadow">
            <Text className="text-neutralWhite text-center font-semibold text-base">Kirim Masukan</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback List */}
        <View>
          <Text className="text-heading font-semibold text-primary mb-3">Masukan Teratas</Text>
          {feedbackList.map((item) => (
            <View key={item.id} className="bg-neutralWhite rounded-2xl p-4 mb-3 shadow-sm border border-neutralGray/50">
              <Text className="font-bold text-title text-secondary mb-1">{item.title}</Text>
              <Text className="text-body text-gray-600 mb-1">{item.desc}</Text>
              <Text className="text-xs text-gray-400">{item.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
