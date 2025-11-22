import Dropdown from "@/components/ui/Dropdown";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { api } from "../../services/api";

export default function SignUpPage() {
  const roleOptions = [
    { label: "Admin Sekolah", value: "admin_sekolah" },
    { label: "Admin Catering", value: "admin_catering" },
    { label: "Admin Dinkes", value: "admin_dinkes" },
    { label: "Siswa", value: "siswa" },
  ];

  const [role, setRole] = useState("Select a Role");
  const [roleOpen, setRoleOpen] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [schools, setSchools] = useState([]);
  const [caterings, setCaterings] = useState([]);
  const [healthOffices, setHealthOffices] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [cateringId, setCateringId] = useState("");
  const [healthOfficeAreaId, setHealthOfficeAreaId] = useState("");

  const handleSignUp = async () => {
    if (!username || !fullName || !password || !confirmPassword) {
      Alert.alert("Error", "Mohon lengkapi semua kolom.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password minimal 8 karakter.");
      return;
    }

    if (!role) {
      Alert.alert("Error", "Mohon pilih role.");
      return;
    }
    console.log("REGISTER PAYLOAD:", {
      username,
      full_name: fullName,
      password,
      role,
      school_id: ["admin_sekolah", "siswa"].includes(role)
        ? schoolId
        : undefined,
      catering_id: role === "admin_catering" ? cateringId : undefined,
      health_office_area_id:
        role === "admin_dinkes" ? healthOfficeAreaId : undefined,
    });

    setLoading(true);
    try {
      await api("auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          full_name: fullName,
          password,
          role,
          school_id: ["admin_sekolah", "siswa"].includes(role)
            ? schoolId
            : undefined,
          catering_id: role === "admin_catering" ? cateringId : undefined,
          health_office_area_id:
            role === "admin_dinkes" ? healthOfficeAreaId : undefined,
        }),
      });

      Alert.alert("Sukses", "Akun berhasil dibuat. Silakan login.", [
        { text: "Login", onPress: () => router.replace("/(auth)") },
      ]);
    } catch (error: any) {
      Alert.alert("Gagal", error.message || "Gagal membuat akun.");
    } finally {
      setLoading(false);
    }
  };

  const onRoleSelect = async (selectedRole: string) => {
    setRole(selectedRole); // set first so UI updates
    try {
      if (["admin_sekolah", "siswa"].includes(selectedRole)) {
        const res = await api("public/sekolah");
        console.log("Fetched schools:", res); // log raw response
        setSchools(res); // assuming api returns the array directly
        setSchoolId(""); // reset selection
      } else {
        setSchools([]);
        setSchoolId("");
      }

      if (selectedRole === "admin_catering") {
        const res = await api("public/catering");
        console.log("Fetched caterings:", res);
        setCaterings(res);
        setCateringId("");
      } else {
        setCaterings([]);
        setCateringId("");
      }

      if (selectedRole === "admin_dinkes") {
        const res = await api("public/health-offices");
        console.log("Fetched health offices:", res);
        setHealthOffices(res);
        setHealthOfficeAreaId("");
      } else {
        setHealthOffices([]);
        setHealthOfficeAreaId("");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="p-6">
            {/* --- HEADER --- */}
            <View className="items-center mb-8 mt-10">
              <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="person-add-outline" size={40} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center">
                Buat Akun Baru
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-4">
                Daftar untuk mulai menggunakan aplikasi.
              </Text>
            </View>

            {/* --- FORM FIELDS --- */}
            {/* --- FORM FIELDS --- */}
            <View className="gap-4">
              {/* FULL NAME */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                  <TextInput
                    className="flex-1 py-3 text-base"
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* USERNAME */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Username
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                  <TextInput
                    className="flex-1 py-3 text-base"
                    placeholder="Masukkan username"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
              </View>

              <Dropdown
                label="Role"
                options={roleOptions}
                value={role}
                onValueChange={(value) => {
                  setRole(value);
                  onRoleSelect(value);
                }}
                placeholder="Pilih Role..."
                className="mt-1"
              />

              {["admin_sekolah", "siswa"].includes(role) && (
                <Dropdown
                  label="Sekolah"
                  options={schools.map((s: any) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                  value={schoolId}
                  onValueChange={setSchoolId}
                />
              )}

              {role === "admin_catering" && (
                <Dropdown
                  label="Catering"
                  options={caterings.map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  value={cateringId}
                  onValueChange={setCateringId}
                />
              )}

              {role === "admin_dinkes" && (
                <Dropdown
                  label="Health Office"
                  options={healthOffices.map((h: any) => ({
                    label: h.name,
                    value: h.id,
                  }))}
                  value={healthOfficeAreaId}
                  onValueChange={setHealthOfficeAreaId}
                />
              )}

              {/* PASSWORD */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Password
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                  <TextInput
                    className="flex-1 py-3 text-base"
                    placeholder="Minimal 8 karakter"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CONFIRM PASSWORD */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
                  <TextInput
                    className="flex-1 py-3 text-base"
                    placeholder="Ulangi password"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              {/* SUBMIT */}
              <Button
                title="Daftar"
                onPress={handleSignUp}
                loading={loading}
                className="mt-2"
              />

              {/* LOGIN LINK */}
              <View className="items-center mt-4">
                <Text>
                  Sudah punya akun?{" "}
                  <Text
                    className="text-primary font-semibold underline"
                    onPress={() => router.push("/(auth)")}
                  >
                    Login
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
