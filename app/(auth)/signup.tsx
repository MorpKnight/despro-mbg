import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { SignupForm } from "../../components/auth/SignupForm";

export default function SignUpPage() {
  const heroContent = (
    <>
      <View className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl items-center justify-center mb-8 border border-white/20">
        <Ionicons name="person-add-outline" size={48} color="white" />
      </View>
      <Text className="text-white text-5xl font-bold leading-tight mb-6 text-center">
        Bergabunglah{'\n'}Bersama Kami
      </Text>
      <Text className="text-emerald-100 text-xl leading-relaxed text-center">
        Daftarkan diri Anda untuk mulai berkontribusi dalam program Makan Bergizi Gratis.
      </Text>
    </>
  );

  return (
    <AuthLayout
      heroContent={heroContent}
      mobileTitle="Buat Akun Baru"
      mobileSubtitle="Daftar untuk mulai menggunakan aplikasi"
      mobileIcon={<Ionicons name="person-add-outline" size={32} color="#10B981" />}
    >
      <SignupForm />
    </AuthLayout>
  );
}
