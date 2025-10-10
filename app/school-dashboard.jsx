import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router"

export default function WireframeToDesign() {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const router = useRouter()

  return (
    <View className="flex-1 bg-[#f5f7fb] p-4">
      {/* Banner atas: Emergency Reporting */}
      <View className="bg-white rounded-2xl p-6 shadow-sm">
        <View className="items-center mb-4">
          <View className="w-12 h-12 rounded-full border-2 border-blue-600 bg-blue-50 items-center justify-center mb-2">
            <Text className="text-blue-600 font-bold text-xl">!</Text>
          </View>
          <Text className="text-lg font-bold text-[#333]">Pelaporan Darurat</Text>
          <Text className="text-sm text-gray-600 text-center">
            Segera laporkan keadaan darurat yang membutuhkan tindak lanjut
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buat Laporan Darurat"
          onPress={() => router.push("/school-emergency-report")}
          className="bg-blue-600 py-3 px-5 rounded-lg self-center active:opacity-90"
        >
          <Text className="text-white font-semibold text-sm">BUAT LAPORAN DARURAT</Text>
        </Pressable>
      </View>

      {/* Area bawah: Attendance + Announcements */}
      <View
        className={`mt-4 ${isMobile ? "flex-col" : "flex-row"} gap-3`}
      >
        {/* Attendance card */}
        <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center mr-2">
              <Text className="text-emerald-500 text-lg">👥</Text>
            </View>
            <Text className="text-base font-semibold text-[#333]">Kehadiran Hari Ini</Text>
          </View>

          <View className="items-center mb-3">
            <Text className="text-3xl font-bold text-[#333]">342/380</Text>
            <Text className="text-sm text-gray-500">Siswa Menerima MBG</Text>
          </View>

          <View className="h-px bg-gray-200 mb-3" />

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Status Perangkat:</Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                <Text className="text-sm text-[#333]">Online</Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Pembaruan Terakhir:</Text>
              <Text className="text-sm text-[#333]">2 menit yang lalu</Text>
            </View>
          </View>
        </View>

        {/* Announcements card */}
        <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center mr-2">
              <Text className="text-blue-600 text-lg">📣</Text>
            </View>
            <Text className="text-base font-semibold text-[#333]">Pengumuman</Text>
          </View>

          {/* Announcement item 1 */}
          <View className="flex-row mb-4">
            <View className="w-7 h-7 rounded-full border border-blue-600 bg-blue-50 items-center justify-center mr-2">
              <Text className="text-blue-600 font-semibold">i</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#333]">Pembaruan Pemeriksaan Kesehatan</Text>
              <Text className="text-sm text-gray-600">
                Protokol kesehatan baru berlaku mulai 15 Januari 2025. Silakan tinjau kembali pedoman yang
                telah diperbarui.
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Petugas Kesehatan · 2 jam yang lalu</Text>
            </View>
          </View>

          {/* Announcement item 2 */}
          <View className="flex-row">
            <View className="w-7 h-7 rounded-full border border-emerald-500 bg-emerald-50 items-center justify-center mr-2">
              <Text className="text-emerald-500 font-semibold">!</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#333]">Pemeliharaan Sistem</Text>
              <Text className="text-sm text-gray-600">
                Pemeliharaan terjadwal malam ini pukul 23.00 hingga 01.00. Sistem mungkin tidak tersedia
                sementara waktu.
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Admin TI · 1 hari yang lalu</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
