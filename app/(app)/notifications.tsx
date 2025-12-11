import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { FlatList, Text, View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchMyProfile } from "@/services/profile";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";

import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useSnackbar } from "../../hooks/useSnackbar";
import { api } from "../../services/api";
import * as Clipboard from "expo-clipboard";

const BroadcastSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(5),
  level: z.enum(["info", "warning", "danger"]),
  target_role: z.string().optional(),
});

const LEVELS = [
  { label: "Info", value: "info" },
  { label: "Peringatan", value: "warning" },
  { label: "Bahaya", value: "danger" },
];

const ROLES = [
  { label: "Semua Pengguna", value: "" },
  { label: "Siswa", value: "siswa" },
  { label: "Admin Sekolah", value: "admin_sekolah" },
  { label: "Admin Katering", value: "admin_catering" },
  { label: "Admin Dinkes", value: "admin_dinkes" },
];

export default function NotificationsPage() {
  const { expoPushToken, notification } = usePushNotifications();
  const { showSnackbar } = useSnackbar();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(BroadcastSchema),
    defaultValues: {
      title: "",
      message: "",
      level: "info",
      target_role: "",
    },
    mode: "onChange",
  });
  // ---- LOAD PROFILE ON PAGE OPEN ----
 useEffect(() => {
  async function loadProfile() {
    try {
      const profile = await fetchMyProfile();

      console.log("Full Profile:", profile);
      console.log("School ID:", profile.schoolId); // 👈 only school_id
      alert(profile.schoolId);
    } catch (err) {
      console.log("Failed to load profile:", err);
    }
  }

  loadProfile();
}, []);


  // Add received notifications
  useEffect(() => {
    if (notification) {
      const newItem = {
        id: Date.now().toString(),
        title: notification.request.content.title,
        message: notification.request.content.body,
        created_at: new Date().toLocaleString("id-ID"),
      };
      setNotifications((prev) => [newItem, ...prev]);
    }
  }, [notification]);

  const renderItem = ({ item }: any) => (
    <Card className="mb-3 p-4 bg-white">
      <Text className="text-base font-bold text-gray-900">{item.title}</Text>
      <Text className="text-gray-600 mt-1">{item.message}</Text>
      <Text className="text-xs text-gray-400 mt-2">{item.created_at}</Text>
    </Card>
  );

  // ---- SEND TO BACKEND ----
  const submitBroadcast = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await api("notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      showSnackbar({ message: "Notifikasi disiarkan.", variant: "success" });
    } catch (err) {
      showSnackbar({ message: "Gagal mengirim.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  });

  // ---- SEND TEST TO OWN DEVICE ----
  const handleTest = async () => {
    const { title, message, level } = getValues();

    if (!expoPushToken) {
      Alert.alert("Token tidak tersedia.");
      return;
    }

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: "default",
        title: `[TEST] ${title}`,
        body: message,
        data: { level },
      }),
    });

    Alert.alert("Test dikirim!");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fb]">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <PageHeader title="Notifikasi & Broadcast" showBackButton={false} />

        {/* ==== NOTIFICATION LIST ==== */}
        <Text className="text-lg font-bold mb-2">Notifikasi Masuk</Text>
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="items-center py-6">
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color="#9CA3AF"
              />
              <Text className="text-gray-500 mt-2">Belum ada notifikasi</Text>
            </View>
          }
        />

        {/* ==== BROADCAST FORM ==== */}
        <Text className="text-lg font-bold mt-6 mb-2">
          Broadcast Notifikasi
        </Text>
        <Card className="p-4">
          {/* TITLE */}
          <Text className="mb-1">Judul</Text>
          <Controller
            control={control}
            name="title"
            render={({ field }) => <TextInput {...field} placeholder="Judul" />}
          />

          {/* MESSAGE */}
          <Text className="mb-2 mt-3">Pesan</Text>
          <Controller
            control={control}
            name="message"
            render={({ field }) => (
              <TextInput
                {...field}
                placeholder="Isi pesan..."
                multiline
                numberOfLines={4}
              />
            )}
          />

          {/* LEVEL */}
          <Text className="mb-2 mt-4">Level</Text>
          <View className="flex-row gap-2">
            {LEVELS.map((l) => {
              const active = watch("level") === l.value;
              return (
                <Button
                  key={l.value}
                  title={l.label}
                  size="sm"
                  onPress={() => setValue("level", l.value)}
                  variant={active ? "primary" : "outline"}
                />
              );
            })}
          </View>

          {/* TARGET ROLE */}
          <Text className="mb-2 mt-4">Target Penerima</Text>
          <View className="flex-row flex-wrap gap-2">
            {ROLES.map((r) => {
              const active = watch("target_role") === r.value;
              return (
                <Button
                  key={r.value}
                  title={r.label}
                  size="sm"
                  variant={active ? "primary" : "outline"}
                  onPress={() => setValue("target_role", r.value)}
                />
              );
            })}
          </View>

          {/* ACTIONS */}
          <View className="mt-5">
            <Button
              title="Test ke HP Ini"
              variant="outline"
              icon={<Ionicons name="phone-portrait-outline" size={18} />}
              onPress={handleTest}
            />

            <View className="h-3" />

            <Button
              title={submitting ? "Mengirim..." : "Broadcast"}
              variant="primary"
              loading={submitting}
              disabled={submitting}
              onPress={submitBroadcast}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
