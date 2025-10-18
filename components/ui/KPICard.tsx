import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface KPICardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function KPICard({ icon, iconColor = '#1976D2', title, value, subtitle, trend }: KPICardProps) {
  return (
    <View className="bg-neutral-white rounded-card shadow-card p-4 flex-1">
      <View className="flex-row items-center mb-2">
        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${iconColor}20` }}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        {trend && (
          <View className="ml-auto">
            <Ionicons
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
              size={20}
              color={trend === 'up' ? '#4CAF50' : trend === 'down' ? '#E53935' : '#6B7280'}
            />
          </View>
        )}
      </View>
      <Text className="text-gray-600 text-sm mb-1">{title}</Text>
      <Text className="text-3xl font-bold text-gray-900 mb-1">{value}</Text>
      {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
    </View>
  );
}
