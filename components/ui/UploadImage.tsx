import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View, Platform } from "react-native";
import { cdnUploadFile } from "../../services/cdnService";

interface ImageUploadProps {
  label?: string;
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ label, onUploaded, disabled = false }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const pickImage = async () => {
    if (disabled) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    try {
      setIsUploading(true);
      const filename = `upload_${Date.now()}.jpg`;

      let fileData: any;

      if (Platform.OS === "android") {
        console.log("[UPLOAD] Using Android URI:", image);

        // Android MUST upload using URI
        fileData = {
          uri: image,
          type: "image/jpeg",
          name: filename,
        };
      } else {
        console.log("[UPLOAD] Converting image to Blob (iOS/Web)");

        const response = await fetch(image);
        const blob = await response.blob();
        console.log("[UPLOAD] Blob size:", blob.size);

        fileData = blob;
      }

      const url = await cdnUploadFile(fileData, filename);

      setUploadedUrl(url);
      onUploaded(url);
      console.log("Uploaded URL:", url);

    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="gap-2">
      {label && <Text className="text-sm font-semibold text-gray-700">{label}</Text>}

      {/* Preview */}
      <TouchableOpacity
        className={`border-2 rounded-xl h-48 justify-center items-center ${
          image ? "border-blue-400" : "border-gray-300"
        } ${disabled && "opacity-50"}`}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-full h-full rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center">
            <Ionicons name="image" size={40} color="#9CA3AF" />
            <Text className="mt-2 text-gray-500">Tap to choose image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Upload Button */}
      <TouchableOpacity
        disabled={!image || disabled || isUploading}
        onPress={uploadImage}
        className={`p-4 rounded-xl items-center ${
          !image || disabled || isUploading ? "bg-gray-300" : "bg-blue-600"
        }`}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text className="text-white font-semibold">Upload Image</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
