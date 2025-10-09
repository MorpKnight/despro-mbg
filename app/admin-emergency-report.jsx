import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native"

export default function AdminLaporanDarurat() {
  const [reports, setReports] = useState([
    {
      id: "LPR-001",
      judul: "Keracunan Makanan Massal",
      tanggal: "2024-01-15 10:30",
      jumlahSiswa: 15,
      deskripsi:
        "Beberapa siswa mengalami mual dan muntah setelah makan siang. Diduga keracunan makanan dari menu ayam goreng.",
      status: "Diproses",
      perbaruanTerakhir: "2024-01-15 10:45",
    },
    {
      id: "LPR-002",
      judul: "Alergi Makanan",
      tanggal: "2024-01-14 12:00",
      jumlahSiswa: 3,
      deskripsi: "Tiga siswa mengalami reaksi alergi setelah mengonsumsi makanan yang mengandung kacang.",
      status: "Selesai",
      perbaruanTerakhir: "2024-01-14 14:30",
    },
    {
      id: "LPR-003",
      judul: "Makanan Basi",
      tanggal: "2024-01-13 09:15",
      jumlahSiswa: 8,
      deskripsi: "Siswa melaporkan makanan berbau tidak sedap dan terasa asam. Beberapa siswa mengalami diare.",
      status: "Terverifikasi",
      perbaruanTerakhir: "2024-01-13 16:20",
    },
    {
      id: "LPR-004",
      judul: "Kontaminasi Makanan",
      tanggal: "2024-01-12 11:45",
      jumlahSiswa: 12,
      deskripsi: "Ditemukan benda asing dalam makanan. Beberapa siswa mengalami sakit perut.",
      status: "Dikirim ke Dinkes",
      perbaruanTerakhir: "2024-01-12 18:00",
    },
  ])

  const [selectedReport, setSelectedReport] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case "Diproses":
        return "bg-amber-100 border-amber-300"
      case "Terverifikasi":
        return "bg-green-100 border-green-300"
      case "Dikirim ke Dinkes":
        return "bg-sky-100 border-sky-300"
      case "Selesai":
        return "bg-blue-100 border-blue-300" 
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Diproses":
        return "text-orange-700"
      case "Terverifikasi":
        return "text-green-700"
      case "Dikirim ke Dinkes":
        return "text-sky-700"
      case "Selesai":
        return "text-blue-700"
      default:
        return "text-gray-700"
    }
  }

  const handleDetailClick = (report) => {
    setSelectedReport(report)
    setModalVisible(true)
  }

  const handleStatusChange = (newStatus) => {
    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    setReports(
      reports.map((report) =>
        report.id === selectedReport.id ? { ...report, status: newStatus, perbaruanTerakhir: formattedDate } : report,
      ),
    )

    setSelectedReport({ ...selectedReport, status: newStatus, perbaruanTerakhir: formattedDate })
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setSelectedReport(null)
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="p-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-slate-800 mb-2">Daftar Laporan Darurat</Text>
            <Text className="text-slate-600">Kelola dan pantau laporan darurat</Text>
          </View>

          {/* Desktop Table View */}
          <View className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <View className="flex-row bg-slate-100 border-b border-slate-200 p-4">
              <Text className="flex-1 font-semibold text-slate-700">ID</Text>
              <Text className="flex-[2] font-semibold text-slate-700">Judul</Text>
              <Text className="flex-1 font-semibold text-slate-700">Status</Text>
              <Text className="flex-1 font-semibold text-slate-700">Perbaruan Terakhir</Text>
              <Text className="w-24 font-semibold text-slate-700 text-center">Aksi</Text>
            </View>

            {/* Table Body */}
            {reports.map((report) => (
              <View key={report.id} className="flex-row items-center p-4 border-b border-slate-100 hover:bg-slate-50">
                <Text className="flex-1 text-slate-700 font-medium">{report.id}</Text>
                <Text className="flex-[2] text-slate-700">{report.judul}</Text>
                <View className="flex-1">
                  <View className={`px-3 py-1.5 rounded-full border ${getStatusColor(report.status)} self-start`}>
                    <Text className={`text-xs font-medium ${getStatusTextColor(report.status)}`}>{report.status}</Text>
                  </View>
                </View>
                <Text className="flex-1 text-slate-600 text-sm">{report.perbaruanTerakhir}</Text>
                <View className="w-24 items-center">
                  <TouchableOpacity
                    onPress={() => handleDetailClick(report)}
                    className="bg-blue-500 px-4 py-2 rounded-lg active:bg-blue-600"
                  >
                    <Text className="text-white font-medium text-sm">Detail</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Mobile Card View */}
          <View className="md:hidden space-y-4">
            {reports.map((report) => (
              <View key={report.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-slate-700 font-bold text-lg">{report.id}</Text>
                  <View className={`px-3 py-1.5 rounded-full border ${getStatusColor(report.status)}`}>
                    <Text className={`text-xs font-medium ${getStatusTextColor(report.status)}`}>{report.status}</Text>
                  </View>
                </View>

                <Text className="text-slate-800 font-semibold mb-2">{report.judul}</Text>
                <Text className="text-slate-600 text-sm mb-3">Perbaruan: {report.perbaruanTerakhir}</Text>

                <TouchableOpacity
                  onPress={() => handleDetailClick(report)}
                  className="bg-blue-500 py-2.5 rounded-lg active:bg-blue-600"
                >
                  <Text className="text-white font-medium text-center">Lihat Detail</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={handleCloseModal}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh]">
            <ScrollView className="p-6">
              {selectedReport && (
                <>
                  {/* Modal Header */}
                  <View className="mb-6">
                    <Text className="text-2xl font-bold text-slate-800 mb-2">Detail Laporan</Text>
                    <View className="h-1 w-16 bg-blue-500 rounded-full" />
                  </View>

                  {/* Report Details */}
                  <View className="space-y-4 mb-6">
                    <View>
                      <Text className="text-slate-500 text-sm mb-1">ID Laporan</Text>
                      <Text className="text-slate-800 font-semibold text-lg">{selectedReport.id}</Text>
                    </View>

                    <View>
                      <Text className="text-slate-500 text-sm mb-1">Judul</Text>
                      <Text className="text-slate-800 font-semibold text-lg">{selectedReport.judul}</Text>
                    </View>

                    <View>
                      <Text className="text-slate-500 text-sm mb-1">Tanggal & Waktu</Text>
                      <Text className="text-slate-800">{selectedReport.tanggal}</Text>
                    </View>

                    <View>
                      <Text className="text-slate-500 text-sm mb-1">Jumlah Siswa Terdampak</Text>
                      <Text className="text-slate-800 font-semibold">{selectedReport.jumlahSiswa} siswa</Text>
                    </View>

                    <View>
                      <Text className="text-slate-500 text-sm mb-1">Deskripsi</Text>
                      <Text className="text-slate-700 leading-6">{selectedReport.deskripsi}</Text>
                    </View>

                    <View>
                      <Text className="text-slate-500 text-sm mb-1">Status Saat Ini</Text>
                      <View
                        className={`px-4 py-2 rounded-full border ${getStatusColor(selectedReport.status)} self-start`}
                      >
                        <Text className={`font-medium ${getStatusTextColor(selectedReport.status)}`}>
                          {selectedReport.status}
                        </Text>
                      </View>
                    </View>

                    <View>
                      <Text className="text-slate-500 text-sm mb-1">Perbaruan Terakhir</Text>
                      <Text className="text-slate-800">{selectedReport.perbaruanTerakhir}</Text>
                    </View>
                  </View>

                  {/* Status Change Buttons */}
                  <View className="mb-6">
                    <Text className="text-slate-700 font-semibold mb-3">Ubah Status</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {["Diproses", "Terverifikasi", "Dikirim ke Dinkes", "Selesai"].map((status, index) => {
                        const statusFlow = ["Diproses", "Terverifikasi", "Dikirim ke Dinkes", "Selesai"]
                        const currentIndex = statusFlow.indexOf(selectedReport.status)
                        const enabled = index > currentIndex

                        const getButtonColor = (status) => {
                          switch (status) {
                            case "Diproses":
                              return "bg-amber-500 active:bg-amber-600"
                            case "Terverifikasi":
                              return "bg-green-500 active:bg-green-600"
                            case "Dikirim ke Dinkes":
                              return "bg-sky-500 active:bg-sky-600"
                            case "Selesai":
                              return "bg-blue-500 active:bg-blue-600"
                            default:
                              return "bg-gray-400"
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={status}
                            onPress={() => enabled && handleStatusChange(status)}
                            disabled={!enabled}
                            className={`${enabled ? getButtonColor(status) : "bg-gray-300"} px-4 py-2.5 rounded-lg`}
                          >
                            <Text className="text-white font-medium">{status}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>

                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    className="bg-slate-200 py-3 rounded-lg active:bg-slate-300"
                  >
                    <Text className="text-slate-700 font-semibold text-center">Tutup</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
