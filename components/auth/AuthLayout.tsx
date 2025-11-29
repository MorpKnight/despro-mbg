import React from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthLayoutProps {
    children: React.ReactNode;
    heroContent?: React.ReactNode;
    heroColors?: string[]; // For gradient (not implemented in this simplified version but kept for API compat)
    mobileTitle?: string;
    mobileSubtitle?: string;
    mobileIcon?: React.ReactNode;
}

export const AuthLayout = ({
    children,
    heroContent,
    mobileTitle,
    mobileSubtitle,
    mobileIcon,
}: AuthLayoutProps) => {
    // Mobile Layout
    if (Platform.OS !== "web") {
        return (
            <View className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={{ width: 450, height: 450, position: 'absolute', top: -120, right: -120, opacity: 0.04 }}
                    resizeMode="contain"
                />
                <SafeAreaView className="flex-1">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1"
                    >
                        <ScrollView
                            contentContainerStyle={{
                                flexGrow: 1,
                                paddingHorizontal: 24,
                                paddingVertical: 32,
                                justifyContent: 'center'
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            <Animated.View
                                entering={FadeInUp.delay(200).duration(1000).springify()}
                                className="items-center mb-12"
                            >
                                {mobileIcon && (
                                    <View className="w-28 h-28 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl items-center justify-center mb-6 border-2 border-white">
                                        {mobileIcon}
                                    </View>
                                )}
                                {mobileTitle && (
                                    <Text className="text-4xl font-extrabold text-gray-900 text-center mb-3">
                                        {mobileTitle}
                                    </Text>
                                )}
                                {mobileSubtitle && (
                                    <Text className="text-gray-600 text-base mt-1 text-center px-4 leading-relaxed">
                                        {mobileSubtitle}
                                    </Text>
                                )}
                            </Animated.View>

                            <Animated.View
                                entering={FadeInDown.delay(400).duration(1000).springify()}
                                className="bg-white px-7 py-8 rounded-3xl shadow-xl border border-gray-100"
                            >
                                {children}
                            </Animated.View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        );
    }

    // Web Layout
    return (
        <View className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex-row">
            {/* Left hero panel */}
            <View className="hidden md:flex flex-1 relative overflow-hidden bg-blue-600 items-center justify-center">
                <View className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={{ width: 700, height: 700, position: 'absolute', bottom: -150, left: -150, opacity: 0.08 }}
                    resizeMode="contain"
                />

                <Animated.View
                    entering={FadeInUp.delay(200).duration(1000).springify()}
                    className="z-10 px-20 max-w-2xl text-center items-center"
                >
                    {heroContent}
                </Animated.View>
            </View>

            {/* Right form panel */}
            <View className="flex-1 items-center justify-center p-16 relative min-h-screen">
                <ScrollView
                    className="w-full h-full"
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 40
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(1000).springify()}
                        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10 border border-gray-100"
                    >
                        {children}
                    </Animated.View>
                </ScrollView>
            </View>
        </View>
    );
};
