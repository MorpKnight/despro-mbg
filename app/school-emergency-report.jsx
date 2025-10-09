import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList } from "react-native"
import "../global.css";

const dummyData = [
  {
    id: "LPR-001",
    judul: "Keracunan Makanan Kelas 5A",
    tanggal: "2025-03-15",
    status: "Terverifikasi",
    perbaruanTerakhir: "2025-03-15 14:30",
    deskripsi: "Beberapa siswa mengalami mual setelah makan siang",
    jumlahSiswa: 12,
  },
  {
    id: "LPR-002",
    judul: "Alergi Makanan Siswa Kelas 3B",
    tanggal: "2025-03-10",
    status: "Dikirim ke Dinkes",
    perbaruanTerakhir: "2025-03-11 09:15",
    deskripsi: "Siswa mengalami reaksi alergi terhadap kacang",
    jumlahSiswa: 3,
  },
  {
    id: "LPR-003",
    judul: "Keluhan Sakit Perut Massal",
    tanggal: "2025-03-20",
    status: "Diproses",
    perbaruanTerakhir: "2025-03-20 11:00",
    deskripsi: "Banyak siswa mengeluh sakit perut setelah sarapan",
    jumlahSiswa: 25,
  },
]

export default function LaporanDarurat() {
  const [modalVisible, setModalVisible] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [laporan, setLaporan] = useState(dummyData)

  const [formData, setFormData] = useState({
    judul: "",
    tanggal: "",
    waktu: "",
    deskripsi: "",
    jumlahSiswa: "",
    foto: "",
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "Diproses":
        return "bg-amber-100 text-amber-700"
      case "Terverifikasi":
        return "bg-emerald-100 text-emerald-700"
      case "Dikirim ke Dinkes":
        return "bg-sky-100 text-sky-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleSubmit = () => {
    const newLaporan = {
      id: `LPR-${String(laporan.length + 1).padStart(3, "0")}`,
      judul: formData.judul,
      tanggal: formData.tanggal,
      status: "Diproses",
      perbaruanTerakhir: `${formData.tanggal} ${formData.waktu}`,
      deskripsi: formData.deskripsi,
      jumlahSiswa: Number.parseInt(formData.jumlahSiswa) || 0,
    }

    setLaporan([newLaporan, ...laporan])
    setModalVisible(false)
    setToastVisible(true)

    setFormData({
      judul: "",
      tanggal: "",
      waktu: "",
      deskripsi: "",
      jumlahSiswa: "",
      foto: "",
    })

    setTimeout(() => setToastVisible(false), 3000)
  }

  const renderTableRow = ({ item }) => (
    <View className="flex-row border-b border-gray-100 py-4 px-2">
      <Text className="w-20 text-sm text-gray-700 font-medium">{item.id}</Text>
      <Text className="flex-1 text-sm text-gray-700 px-2">{item.judul}</Text>
      <Text className="w-28 text-sm text-gray-600 px-2">{item.tanggal}</Text>
      <View className="w-36 px-2">
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className="text-xs font-medium text-center">{item.status}</Text>
        </View>
      </View>
      <Text className="w-36 text-sm text-gray-600 px-2">{item.perbaruanTerakhir}</Text>
    </View>
  )

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="max-w-7xl mx-auto w-full px-4 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">Laporan Darurat</Text>
            <Text className="text-gray-600">
              Kelola dan pantau laporan kejadian darurat di sekolah
            </Text>
          </View>

          {/* Add Report Button */}
          <View className="mb-6">
            <TouchableOpacity
              className="bg-blue-400 rounded-xl px-6 py-4 shadow-md active:opacity-80"
              onPress={() => setModalVisible(true)}
            >
              <Text className="text-white font-semibold text-center text-base">
                + Laporan Baru
              </Text>
            </TouchableOpacity>
          </View>

          {/* Table */}
          <View className="bg-white rounded-xl shadow-md overflow-hidden">
            <View className="px-4 py-4 bg-blue-50 border-b border-blue-100">
              <Text className="text-lg font-semibold text-gray-800">Riwayat Laporan</Text>
            </View>

            {/* Table Header */}
            <View className="flex-row bg-gray-50 py-3 px-2 border-b border-gray-200">
              <Text className="w-20 text-xs font-bold text-gray-700 uppercase">ID</Text>
              <Text className="flex-1 text-xs font-bold text-gray-700 uppercase px-2">Judul</Text>
              <Text className="w-28 text-xs font-bold text-gray-700 uppercase px-2">Tanggal</Text>
              <Text className="w-36 text-xs font-bold text-gray-700 uppercase px-2">Status</Text>
              <Text className="w-36 text-xs font-bold text-gray-700 uppercase px-2">
                Pembaruan Terakhir
              </Text>
            </View>

            {/* Table Body */}
            <FlatList
              data={laporan}
              renderItem={renderTableRow}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <ScrollView className="max-h-[80vh]">
              <View className="p-6">
                <Text className="text-2xl font-bold text-gray-800 mb-4">
                  Buat Laporan Baru
                </Text>

                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3"
                  placeholder="Judul Laporan"
                  value={formData.judul}
                  onChangeText={(text) => setFormData({ ...formData, judul: text })}
                />
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3"
                  placeholder="Tanggal (YYYY-MM-DD)"
                  value={formData.tanggal}
                  onChangeText={(text) => setFormData({ ...formData, tanggal: text })}
                />
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3"
                  placeholder="Waktu (HH:MM)"
                  value={formData.waktu}
                  onChangeText={(text) => setFormData({ ...formData, waktu: text })}
                />
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 min-h-[100px]"
                  placeholder="Deskripsi"
                  multiline
                  textAlignVertical="top"
                  value={formData.deskripsi}
                  onChangeText={(text) => setFormData({ ...formData, deskripsi: text })}
                />
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6"
                  placeholder="Jumlah Siswa Terdampak"
                  keyboardType="numeric"
                  value={formData.jumlahSiswa}
                  onChangeText={(text) => setFormData({ ...formData, jumlahSiswa: text })}
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 rounded-xl px-6 py-4"
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="text-gray-700 font-semibold text-center">Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-blue-400 rounded-xl px-6 py-4"
                    onPress={handleSubmit}
                  >
                    <Text className="text-white font-semibold text-center">
                      Kirim Laporan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toastVisible && (
        <View className="absolute bottom-8 left-0 right-0 items-center px-4">
          <View className="bg-emerald-500 rounded-xl px-6 py-4 shadow-lg">
            <Text className="text-white font-semibold text-center">
              ✓ Laporan berhasil dikirim!
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}