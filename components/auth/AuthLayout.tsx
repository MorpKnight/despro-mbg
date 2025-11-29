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
                        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
                            <Animated.View
                                entering={FadeInUp.delay(200).duration(1000).springify()}
                                className="items-center mb-8"
                            >
                                {mobileIcon && (
                                    <View className="w-24 h-24 bg-white rounded-3xl shadow-lg items-center justify-center mb-4 border border-gray-100">
                                        {mobileIcon}
                                    </View>
                                )}
                                {mobileTitle && <Text className="text-3xl font-bold text-gray-900 text-center">{mobileTitle}</Text>}
                                {mobileSubtitle && (
                                    <Text className="text-gray-500 mt-2 text-center px-8">
                                        {mobileSubtitle}
                                    </Text>
                                )}
                            </Animated.View>

                            <Animated.View
                                entering={FadeInDown.delay(400).duration(1000).springify()}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4"
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
        <View className="bg-gray-50 min-h-screen flex-row">
            {/* Left hero panel */}
            <View className="hidden md:flex flex-1 relative overflow-hidden bg-blue-600 items-center justify-center">
                <View className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800" />
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={{ width: 600, height: 600, position: 'absolute', bottom: -100, left: -100, opacity: 0.1 }}
                    resizeMode="contain"
                />

                <Animated.View
                    entering={FadeInUp.delay(200).duration(1000).springify()}
                    className="z-10 px-16 max-w-2xl text-center items-center"
                >
                    {heroContent}
                </Animated.View>
            </View>

            {/* Right form panel */}
            <View className="flex-1 items-center justify-center p-12 relative h-screen">
                <ScrollView className="w-full h-full" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(1000).springify()}
                        className="w-full max-w-md"
                    >
                        {children}
                    </Animated.View>
                </ScrollView>
            </View>
        </View>
    );
};
