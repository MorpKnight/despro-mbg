import Dropdown from "@/components/ui/Dropdown";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!username || !fullName || !password || !confirmPassword) {
      setError("Mohon lengkapi semua kolom.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (!role) {
      setError("Mohon pilih role.");
      return;
    }

    setError(null);
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
      const res = await api("auth/register", {
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
      if (!res || res === undefined) {
        throw new Error("API response was invalid or incomplete.");
      }

      console.log(res);

      // 3. Status check logic remains the same
      router.replace("/");
    } catch (err: any) {
      // This block handles status codes 4xx or 5xx, or network errors.
      console.error(err);
      setError(err?.data?.detail || err?.message || "Gagal membuat akun.");
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

  // Mobile Layout
  if (Platform.OS !== "web") {
    return (
      <View className="flex-1 bg-gray-50">
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 400, height: 400, position: 'absolute', top: -100, right: -100, opacity: 0.05 }}
          resizeMode="contain"
        />
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
              <Animated.View
                entering={FadeInUp.delay(200).duration(1000).springify()}
                className="items-center mb-8 mt-4"
              >
                <View className="w-20 h-20 bg-white rounded-3xl shadow-lg items-center justify-center mb-4 border border-gray-100">
                  <Ionicons name="person-add-outline" size={32} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">Buat Akun Baru</Text>
                <Text className="text-gray-500 mt-1 text-center">
                  Daftar untuk mulai menggunakan aplikasi
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(400).duration(1000).springify()}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4"
              >
                {/* Form Fields */}
                <View className="gap-4">
                  {/* FULL NAME */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Nama Lengkap</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:border-primary focus:bg-white transition-all"
                      placeholder="Masukkan nama lengkap"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  {/* USERNAME */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Username</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:border-primary focus:bg-white transition-all"
                      placeholder="Masukkan username"
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                    />
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
                    <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</Text>
                    <View className="relative">
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:border-primary focus:bg-white transition-all pr-12"
                        placeholder="Minimal 8 karakter"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3.5"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* CONFIRM PASSWORD */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Konfirmasi Password</Text>
                    <View className="relative">
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:border-primary focus:bg-white transition-all"
                        placeholder="Ulangi password"
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>

                  {error && (
                    <Animated.View entering={FadeInDown} className="bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center gap-2">
                      <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                      <Text className="text-red-600 text-sm flex-1">{error}</Text>
                    </Animated.View>
                  )}

                  {/* SUBMIT */}
                  <Button
                    title="Daftar Sekarang"
                    onPress={handleSignUp}
                    loading={loading}
                    className="mt-4 shadow-md shadow-blue-500/30"
                    size="lg"
                  />

                  {/* LOGIN LINK */}
                  <View className="items-center mt-2">
                    <Text className="text-gray-500 text-sm">
                      Sudah punya akun?{" "}
                      <Text
                        className="text-primary font-bold"
                        onPress={() => router.push("/(auth)")}
                      >
                        Masuk
                      </Text>
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // Web Layout
  return (
    <View className="bg-gray-50 min-h-screen flex-row">
      {/* Left Hero Panel */}
      <View className="hidden md:flex flex-1 relative overflow-hidden bg-emerald-600 items-center justify-center">
        <View className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800" />
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 600, height: 600, position: 'absolute', bottom: -100, left: -100, opacity: 0.1 }}
          resizeMode="contain"
        />

        <Animated.View
          entering={FadeInUp.delay(200).duration(1000).springify()}
          className="z-10 px-16 max-w-2xl text-center items-center"
        >
          <View className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl items-center justify-center mb-8 border border-white/20">
            <Ionicons name="person-add-outline" size={48} color="white" />
          </View>
          <Text className="text-white text-5xl font-bold leading-tight mb-6 text-center">
            Bergabunglah{'\n'}Bersama Kami
          </Text>
          <Text className="text-emerald-100 text-xl leading-relaxed text-center">
            Daftarkan diri Anda untuk mulai berkontribusi dalam program Makan Bergizi Gratis.
          </Text>
        </Animated.View>
      </View>

      {/* Right Form Panel */}
      <View className="flex-1 items-center justify-center p-8 relative h-screen">
        <ScrollView className="w-full h-full" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <Animated.View
            entering={FadeInDown.delay(400).duration(1000).springify()}
            className="w-full max-w-md"
          >
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Buat Akun
              </Text>
              <Text className="text-gray-500 text-lg">
                Lengkapi data diri Anda di bawah ini
              </Text>
            </View>

            <View className="gap-5">
              {/* FULL NAME */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</Text>
                <TextInput
                  className="h-12 bg-white border border-gray-200 rounded-lg px-4 text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* USERNAME */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Username</Text>
                <TextInput
                  className="h-12 bg-white border border-gray-200 rounded-lg px-4 text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  placeholder="Masukkan username"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
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
                <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
                <View className="relative">
                  <TextInput
                    className="h-12 bg-white border border-gray-200 rounded-lg px-4 text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all pr-12"
                    placeholder="Minimal 8 karakter"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    className="absolute right-0 top-0 h-12 w-12 items-center justify-center"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CONFIRM PASSWORD */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Konfirmasi Password</Text>
                <View className="relative">
                  <TextInput
                    className="h-12 bg-white border border-gray-200 rounded-lg px-4 text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="Ulangi password"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              {error && (
                <Animated.View entering={FadeInDown} className="bg-red-50 p-4 rounded-xl border border-red-200 flex-row items-center gap-3">
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text className="text-red-700 font-medium flex-1">{error}</Text>
                </Animated.View>
              )}

              {/* SUBMIT */}
              <Button
                title="Daftar"
                onPress={handleSignUp}
                loading={loading}
                className="mt-4 shadow-lg shadow-emerald-600/20"
                size="lg"
              />

              {/* LOGIN LINK */}
              <View className="items-center mt-6">
                <Text className="text-gray-500">
                  Sudah punya akun?{" "}
                  <Text
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                    onPress={() => router.push("/(auth)")}
                  >
                    Masuk
                  </Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}
