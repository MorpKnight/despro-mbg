import Dropdown from "@/components/ui/Dropdown";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import { api } from "../../services/api";

export const SignupForm = () => {
    const router = useRouter();
    const roleOptions = [
        { label: "Admin Sekolah", value: "admin_sekolah" },
        { label: "Admin Catering", value: "admin_catering" },
        { label: "Admin Dinkes", value: "admin_dinkes" },
        { label: "Siswa", value: "siswa" },
    ];

    const [role, setRole] = useState("Select a Role");
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

    const onRoleSelect = async (selectedRole: string) => {
        setRole(selectedRole);
        try {
            if (["admin_sekolah", "siswa"].includes(selectedRole)) {
                const res = await api("public/sekolah");
                setSchools(res);
                setSchoolId("");
            } else {
                setSchools([]);
                setSchoolId("");
            }

            if (selectedRole === "admin_catering") {
                const res = await api("public/catering");
                setCaterings(res);
                setCateringId("");
            } else {
                setCaterings([]);
                setCateringId("");
            }

            if (selectedRole === "admin_dinkes") {
                const res = await api("public/health-offices");
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

            router.replace("/");
        } catch (err: any) {
            console.error(err);
            setError(err?.data?.detail || err?.message || "Gagal membuat akun.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View>
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
        </View>
    );
};
