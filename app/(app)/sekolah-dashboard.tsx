import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";

interface Attendance {
  total: number;
  hadir: number;
  lastUpdate: string;
  deviceStatus: string;
}

interface Announcement {
  id: number;
  title: string;
  desc: string;
  author: string;
  time: string;
  icon: string;
  color: "blue" | "emerald";
}

interface Feedback {
  id: string;
  emoji: string;
  name: string;
  kelas: string;
  comment: string;
  time: string;
}

interface SchoolData {
  attendance: Attendance;
  announcements: Announcement[];
  feedback: Feedback[];
}

interface School {
  id: string;
  name: string;
}

export default function SekolahDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const schools: School[] = useMemo(
    () => [
      { id: "s1", name: "SDN Harapan Bangsa" },
      { id: "s2", name: "SDN Melati 03" },
      { id: "s3", name: "SDN Cibuluh 01" },
      { id: "s4", name: "SDN Cipaku 02" },
      { id: "s5", name: "SDN Sukasari 05" },
    ],
    []
  );

  const [selectedSchool, setSelectedSchool] = useState<string>(schools[0].id);

  useEffect(() => {
    if (user?.role === "admin sekolah") setSelectedSchool(schools[0].id);
  }, [user?.role, schools]);

  if (user?.role !== "admin sekolah" && user?.role !== "super admin") {
    return <Redirect href="/" />;
  }

  // ✅ Default fallback data (won’t crash if selected school missing)
  const defaultSchoolData: SchoolData = {
    attendance: {
      total: 0,
      hadir: 0,
      lastUpdate: "-",
      deviceStatus: "Offline",
    },
    announcements: [],
    feedback: [],
  };

  const schoolData: Record<string, SchoolData> = {
    s1: {
      attendance: {
        total: 380,
        hadir: 342,
        lastUpdate: "2 menit yang lalu",
        deviceStatus: "Online",
      },
      announcements: [
        {
          id: 1,
          title: "Pembaruan Pemeriksaan Kesehatan",
          desc: "Protokol kesehatan baru berlaku mulai 15 Januari 2025.",
          author: "Petugas Kesehatan",
          time: "2 jam yang lalu",
          icon: "i",
          color: "blue",
        },
        {
          id: 2,
          title: "Pemeliharaan Sistem",
          desc: "Pemeliharaan terjadwal malam ini pukul 23.00–01.00.",
          author: "Admin TI",
          time: "1 hari yang lalu",
          icon: "!",
          color: "emerald",
        },
      ],
      feedback: [
        {
          id: "f1",
          emoji: "😊",
          name: "Ahmad Rizki",
          kelas: "5A",
          comment: "Ayamnya enak banget! Terima kasih Bu!",
          time: "2 jam yang lalu",
        },
        {
          id: "f2",
          emoji: "🙁",
          name: "Siti Nurhaliza",
          kelas: "4B",
          comment: "Sayurnya kurang asin",
          time: "3 jam yang lalu",
        },
        {
          id: "f3",
          emoji: "😍",
          name: "Budi Santoso",
          kelas: "6C",
          comment: "Menu hari ini juara!",
          time: "4 jam yang lalu",
        },
      ],
    },
    s2: {
      attendance: {
        total: 410,
        hadir: 390,
        lastUpdate: "5 menit yang lalu",
        deviceStatus: "Online",
      },
      announcements: [
        {
          id: 1,
          title: "Pemeriksaan Gizi",
          desc: "Jadwal pemeriksaan gizi siswa minggu depan.",
          author: "Petugas Kesehatan",
          time: "1 jam yang lalu",
          icon: "i",
          color: "blue",
        },
      ],
      feedback: [
        {
          id: "f4",
          emoji: "😐",
          name: "Rangga",
          kelas: "3A",
          comment: "Nasi agak keras",
          time: "1 jam yang lalu",
        },
        {
          id: "f5",
          emoji: "😊",
          name: "Lina Puspa",
          kelas: "6C",
          comment: "Buahnya segar 👍",
          time: "2 jam yang lalu",
        },
      ],
    },
  };

  // ✅ Safe access: fallback to defaultSchoolData
  const current: SchoolData = schoolData[selectedSchool] ?? defaultSchoolData;

  return (
    <ScrollView className="flex-1 bg-[#f5f7fb] p-4">
      {/* School selector for super admin */}
      {user?.role === "super admin" && (
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Pilih Sekolah:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {schools.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSelectedSchool(s.id)}
                className={`px-4 py-2 rounded-full border ${
                  selectedSchool === s.id
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={
                    selectedSchool === s.id
                      ? "text-white font-semibold"
                      : "text-gray-700 font-semibold"
                  }
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Emergency report banner */}
      <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
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
          onPress={() => router.push("/(app)/emergency-report")}
          className="bg-blue-600 py-3 px-5 rounded-lg self-center active:opacity-90"
        >
          <Text className="text-white font-semibold text-sm">
            BUAT LAPORAN DARURAT
          </Text>
        </Pressable>
      </View>

      {/* Attendance + Announcements */}
      <View className={`${isMobile ? "flex-col" : "flex-row"} gap-3`}>
        {/* Attendance card */}
        <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm mb-3">
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center mr-2">
              <Text className="text-emerald-500 text-lg">👥</Text>
            </View>
            <Text className="text-base font-semibold text-[#333]">
              Kehadiran Hari Ini
            </Text>
          </View>
          <View className="items-center mb-3">
            <Text className="text-3xl font-bold text-[#333]">
              {current.attendance.hadir}/{current.attendance.total}
            </Text>
            <Text className="text-sm text-gray-500">Siswa Menerima MBG</Text>
          </View>
          <View className="h-px bg-gray-200 mb-3" />
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Status Perangkat:</Text>
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full ${
                    current.attendance.deviceStatus === "Online"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  } mr-1`}
                />
                <Text className="text-sm text-[#333]">
                  {current.attendance.deviceStatus}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">
                Pembaruan Terakhir:
              </Text>
              <Text className="text-sm text-[#333]">
                {current.attendance.lastUpdate}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-end mt-4">
            <Text
              className="text-primary font-semibold"
              onPress={() => router.push("/(app)/student-attendance")}
            >
              Lihat Detail
            </Text>
          </View>
        </View>

        {/* Announcements card */}
        <View className="flex-1 bg-white rounded-2xl p-6 shadow-sm mb-3">
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center mr-2">
              <Text className="text-blue-600 text-lg">📣</Text>
            </View>
            <Text className="text-base font-semibold text-[#333]">
              Pengumuman
            </Text>
          </View>
          {current.announcements.map((a) => (
            <View key={a.id} className="flex-row mb-4">
              <View
                className={`w-7 h-7 rounded-full border ${
                  a.color === "blue"
                    ? "border-blue-600 bg-blue-50"
                    : "border-emerald-500 bg-emerald-50"
                } items-center justify-center mr-2`}
              >
                <Text
                  className={
                    a.color === "blue"
                      ? "text-blue-600 font-semibold"
                      : "text-emerald-500 font-semibold"
                  }
                >
                  {a.icon}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#333]">
                  {a.title}
                </Text>
                <Text className="text-sm text-gray-600">{a.desc}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {a.author} · {a.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Feedback section */}
      <View className="bg-white rounded-2xl p-6 shadow-sm mt-3">
        <View className="flex-row items-center mb-3">
          <View className="w-9 h-9 rounded-full bg-yellow-50 items-center justify-center mr-2">
            <Text className="text-yellow-500 text-lg">💬</Text>
          </View>
          <Text className="text-base font-semibold text-[#333]">
            Umpan Balik Terbaru
          </Text>
        </View>
        {current.feedback.length === 0 ? (
          <Text className="text-gray-500">
            Belum ada umpan balik terbaru.
          </Text>
        ) : (
          <View>
            {current.feedback.map((f) => (
              <View
                key={f.id}
                className="flex-row items-start mb-4 pb-4 border-b border-gray-100"
              >
                <Text className="text-2xl mr-3">{f.emoji}</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">
                    {f.name} • Kelas {f.kelas}
                  </Text>
                  <Text className="text-gray-600">{f.comment}</Text>
                  <Text className="text-xs text-gray-500 mt-1">{f.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View className="flex-row justify-end mt-3">
          <Text
            className="text-primary font-semibold"
            onPress={() => router.push("/(app)/feedback-list")}
          >
            Lihat Semua
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
