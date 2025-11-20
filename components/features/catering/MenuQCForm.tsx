import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { OfflineBadge } from '../../../components/ui/OfflineBadge';
import TextInput from '../../../components/ui/TextInput';
import { useOffline } from '../../../hooks/useOffline';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { formatDate } from '../../../lib/utils';
import { api } from '../../../services/api';

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface IngredientPayload {
  name: string;
  quantity: number;
  unit: string;
}

export interface MenuQCEntry {
  date: string; // YYYY-MM-DD
  menuName: string;
  ingredients: IngredientPayload[];
  notes?: string;
  photos: { uri: string; name?: string; type?: string }[];
}

const todayStr = () => formatDate(new Date());
const EMPTY_INGREDIENT: Ingredient = { name: '', quantity: '', unit: '' };

export default function MenuQCForm() {
  const { isOnline } = useOffline();
  const { showSnackbar } = useSnackbar();
  const [date, setDate] = useState<string>(todayStr());
  const [menuName, setMenuName] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([EMPTY_INGREDIENT]);
  const [photos, setPhotos] = useState<MenuQCEntry['photos']>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pickerExpanded, setPickerExpanded] = useState(Platform.OS === 'ios');
  const [uploadProgress, setUploadProgress] = useState(0);

  const isValid = useMemo(() => {
    if (!date || !menuName) return false;
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) return false;
    return true;
  }, [date, menuName]);

  useEffect(() => {
    if (!submitting) {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(0.1);
    const timer = setInterval(() => {
      setUploadProgress((prev) => (prev < 0.9 ? prev + 0.1 : prev));
    }, 400);
    return () => clearInterval(timer);
  }, [submitting]);

  function updateIngredient(i: number, patch: Partial<Ingredient>) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setDate(formatDate(selected));
    }
    if (Platform.OS !== 'ios') {
      setPickerExpanded(false);
    }
  };

  const openDatePicker = () => {
    const current = new Date(date);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: current, mode: 'date', onChange: handleDateChange });
    } else {
      setPickerExpanded((prev) => !prev);
    }
  };

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: false, quality: 0.5 });
    if (!res.canceled) {
      const asset = res.assets[0];
      let optimizedUri = asset.uri;
      try {
        const optimized = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.6, format: SaveFormat.JPEG },
        );
        optimizedUri = optimized.uri;
      } catch (error) {
        console.warn('[menu-qc] gagal kompres gambar', error);
      }
      setPhotos((prev) => [
        ...prev,
        { uri: optimizedUri, name: asset.fileName || `photo_${prev.length + 1}.jpg`, type: asset.mimeType || 'image/jpeg' },
      ]);
    }
  }

  async function submit() {
    if (!isValid) {
      Alert.alert('Form belum lengkap', 'Mohon isi tanggal dan nama menu minimal.');
      return;
    }

    const trimmed = ingredients
      .map((item) => ({
        name: item.name.trim(),
        quantityText: item.quantity.trim(),
        unit: item.unit.trim(),
      }))
      .filter((item) => item.name || item.unit || item.quantityText !== '');

    if (trimmed.length === 0) {
      Alert.alert('Bahan belum diisi', 'Tambahkan minimal satu bahan beserta kuantitas dan satuannya.');
      return;
    }

    const preparedIngredients: IngredientPayload[] = trimmed.map((item) => ({
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantityText),
    }));

    const invalidIngredient = preparedIngredients.find(
      (ing) => !ing.name || !ing.unit || Number.isNaN(ing.quantity) || ing.quantity <= 0,
    );
    if (invalidIngredient) {
      Alert.alert(
        'Data bahan tidak valid',
        'Pastikan seluruh bahan memiliki nama, satuan, dan jumlah lebih dari 0.',
      );
      return;
    }

    const payload: MenuQCEntry = {
      date,
      menuName: menuName.trim(),
      notes: notes.trim() || undefined,
      ingredients: preparedIngredients,
      photos,
    };

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('nama_menu', payload.menuName);
      form.append('tanggal', payload.date);
      form.append('ingredients', JSON.stringify(payload.ingredients));
      if (payload.notes) form.append('notes', payload.notes);
      photos.forEach((p, idx) => {
        // @ts-ignore React Native FormData file support
        form.append('files', {
          uri: p.uri,
          name: p.name || `photo_${idx + 1}.jpg`,
          type: p.type || 'image/jpeg',
        } as any);
      });

      await api('menus/', { method: 'POST', body: form });
      setUploadProgress(1);
      showSnackbar({ message: 'Menu harian & QC berhasil dikirim.', variant: 'success' });
      // Reset form
      setMenuName('');
      setNotes('');
      setIngredients([{ ...EMPTY_INGREDIENT }]);
      setPhotos([]);
    } catch {
      // Offline or error -> queue locally
      try {
        const key = 'menu_qc_queue';
        const existingRaw = await (await import('../../../services/storage')).storage.get<any[]>(key);
        const queue = Array.isArray(existingRaw) ? existingRaw : [];
        queue.push(payload);
        await (await import('../../../services/storage')).storage.set(key, queue);
        showSnackbar({ message: 'Anda offline. Data diantrikan untuk sinkron otomatis.', variant: 'info' });
      } catch {}
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Text className="text-lg font-bold mb-2">Input Menu Harian & QC</Text>
        <Text className="text-gray-600 mb-4">Isi detail menu, bahan baku, tanggal produksi, dan unggah dokumentasi pendukung (opsional).</Text>
        <OfflineBadge isOnline={isOnline} className="mb-3" />

        <View className="mb-3">
          <Text className="mb-1 text-gray-800">Tanggal Produksi</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
            onPress={openDatePicker}
            accessibilityRole="button"
          >
            <Text className="text-base text-gray-900 font-semibold">
              {new Date(date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Ionicons name="calendar" size={20} color="#1976D2" />
          </TouchableOpacity>
          {pickerExpanded && (
            <View className="mt-2">
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
              />
            </View>
          )}
        </View>

        <View className="mb-3">
          <Text className="mb-1 text-gray-800">Nama Menu</Text>
          <TextInput value={menuName} onChangeText={setMenuName} placeholder="Contoh: Nasi Ayam Teriyaki" />
        </View>

        <View className="mb-3">
          <Text className="mb-2 text-gray-800">Bahan Baku</Text>
          {ingredients.map((ing, idx) => (
            <View key={idx} className="mb-2">
              <View className="flex-row gap-2">
                <View style={{ flex: 2 }}>
                  <TextInput value={ing.name} onChangeText={(t) => updateIngredient(idx, { name: t })} placeholder="Nama bahan" />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput value={ing.quantity} onChangeText={(t) => updateIngredient(idx, { quantity: t })} placeholder="Qty" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput value={ing.unit} onChangeText={(t) => updateIngredient(idx, { unit: t })} placeholder="Satuan" />
                </View>
              </View>
              {ingredients.length > 1 && (
                <View className="mt-1">
                  <Button title="Hapus bahan" variant="secondary" onPress={() => removeIngredient(idx)} />
                </View>
              )}
            </View>
          ))}
          <Button title="Tambah bahan" variant="secondary" onPress={addIngredient} className="mt-1" />
        </View>

        <View className="mb-3">
          <Text className="mb-1 text-gray-800">Catatan (opsional)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Catatan QC, suhu penyajian, dll." multiline numberOfLines={3} />
        </View>

        <View className="mb-3">
          <Text className="mb-2 text-gray-800">Dokumentasi (foto, opsional)</Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            {photos.map((p, idx) => (
              <View key={idx} className="relative">
                <Image
                  source={{ uri: p.uri }}
                  style={{ width: 86, height: 86, borderRadius: 10, backgroundColor: '#e5e7eb' }}
                />
                <TouchableOpacity
                  className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1"
                  onPress={() => removePhoto(idx)}
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
                {submitting && (
                  <View className="absolute inset-0 bg-black/40 rounded-2xl items-center justify-center">
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
            ))}
          </View>
          <Button title="Pilih foto" variant="secondary" onPress={pickImage} />
        </View>

        <Button title={submitting ? 'Menyimpan…' : 'Simpan'} onPress={submit} loading={submitting} disabled={!isValid || submitting} className="mt-2" />
        {submitting && (
          <View className="mt-3">
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-blue-500" style={{ width: `${Math.round(uploadProgress * 100)}%` }} />
            </View>
            <Text className="text-xs text-gray-600 mt-1">Mengunggah dokumentasi…</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
