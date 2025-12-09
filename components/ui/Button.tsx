import React, { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  View,
} from "react-native";
import { Platform } from "react-native";
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface Props extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  /** Optional icon component to show before text */
  icon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  style,
  className = "",
  textClassName = "",
  icon,
  fullWidth = false,
  ...rest
}: Props) {
  const [hovered, setHovered] = useState(false);

  const handleHoverIn: PressableProps["onHoverIn"] = (e) => {
    setHovered(true);
    if (rest.onHoverIn) {
      (rest.onHoverIn as any)(e);
    }
  };

  const handleHoverOut: PressableProps["onHoverOut"] = (e) => {
    setHovered(false);
    if (rest.onHoverOut) {
      (rest.onHoverOut as any)(e);
    }
  };

  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  let bgClass = "bg-gradient-to-r from-blue-600 to-blue-500";
  let textClass = "text-white";
  let borderClass = "";

  if (isSecondary) {
    bgClass = "bg-gray-100";
    textClass = "text-gray-900";
  } else if (isOutline) {
    bgClass = "bg-transparent";
    textClass = "text-blue-600";
    borderClass = "border-2 border-blue-600";
  } else if (isGhost) {
    bgClass = "bg-transparent";
    textClass = "text-blue-600";
  }

  let sizeClass = "px-6 py-3";
  let textSizeClass = "text-base";

  if (size === "sm") {
    sizeClass = "px-4 py-2";
    textSizeClass = "text-sm";
  } else if (size === "lg") {
    sizeClass = "px-8 py-4";
    textSizeClass = "text-lg";
  }

  // apply hover styles (web)
  if (!disabled && hovered) {
    if (variant === "primary") {
      bgClass = "bg-gradient-to-r from-blue-700 to-blue-600";
    } else if (isSecondary) {
      bgClass = "bg-gray-200";
      textClass = "text-gray-900";
    } else if (isOutline) {
      bgClass = "bg-blue-50";
      textClass = "text-blue-700";
    } else if (isGhost) {
      bgClass = "bg-blue-50";
      textClass = "text-blue-700";
    }
  }

  // Add the Tailwind class for the custom shadow (works on iOS/Web)
  const shadowClass =
    variant === "primary" && !disabled && !loading
      ? "shadow-lg shadow-blue-500/50"
      : "";

  // Determine the Android elevation background color
  // On Android, elevation requires a non-transparent background to draw a shadow.
  // Setting it to 'transparent' prevents the white artifact on other variants.
  let androidElevationStyle = {};
  if (Platform.OS === "android") {
    const defaultElevation = 2; // Default low elevation for non-primary buttons

    if (variant === "primary" && !disabled) {
      // Primary button gets a higher elevation and the background color of the button (to hide default white)
      androidElevationStyle = {
        elevation: 5,
        // Note: Nativewind often handles gradient backgrounds better than hardcoding
        // For safety, we set a basic blue color that closely matches
        backgroundColor: "#3b82f6", // Corresponds to blue-600
      };
    } else if (variant === "secondary" && !disabled) {
      // Secondary/Outline/Ghost usually should inherit or use a white/transparent background.
      androidElevationStyle = {
        elevation: defaultElevation,
        backgroundColor: isSecondary ? "#f3f4f6" : "transparent", // gray-100 or transparent
      };
    } else if (isOutline || isGhost) {
      androidElevationStyle = {
        elevation: defaultElevation,
        backgroundColor: "transparent",
      };
    } else {
      androidElevationStyle = { elevation: 0 };
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`${sizeClass} rounded-xl flex-row items-center justify-center ${bgClass} ${borderClass} ${disabled || loading ? "opacity-50" : "active:opacity-80"} ${fullWidth ? "w-full" : ""} ${className} ${shadowClass}`}
      style={[
        // Apply the refined Android elevation/background style
        androidElevationStyle,
        style as any,
      ]}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline || isGhost ? "#1976D2" : "#FFFFFF"}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className={`${textClass} font-semibold ${textSizeClass} ${textClassName}`}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default React.memo(Button);
