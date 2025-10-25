import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import TextInput from '../../../components/ui/TextInput';
import { useOffline } from '../../../hooks/useOffline';
import { formatDate } from '../../../lib/utils';
import { api } from '../../../services/api';

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface MenuQCEntry {
  date: string; // YYYY-MM-DD
  menuName: string;
  ingredients: Ingredient[];
  notes?: string;
  photos: { uri: string; name?: string; type?: string }[];
}

const todayStr = () => formatDate(new Date());

export default function MenuQCForm() {
  const { isOnline } = useOffline();
  const [date, setDate] = useState<string>(todayStr());
  const [menuName, setMenuName] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: '', unit: '' }]);
  const [photos, setPhotos] = useState<MenuQCEntry['photos']>([]);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => {
    if (!date || !menuName) return false;
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) return false;
    return true;
  }, [date, menuName]);

  function updateIngredient(i: number, patch: Partial<Ingredient>) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }]);
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: false, quality: 0.7 });
    if (!res.canceled) {
      const asset = res.assets[0];
      setPhotos((prev) => [
        ...prev,
        { uri: asset.uri, name: asset.fileName || `photo_${prev.length + 1}.jpg`, type: asset.mimeType || 'image/jpeg' },
      ]);
    }
  }

  async function submit() {
    if (!isValid) {
      Alert.alert('Form belum lengkap', 'Mohon isi tanggal dan nama menu minimal.');
      return;
    }
    const payload: MenuQCEntry = { date, menuName, notes, ingredients: ingredients.filter(i => i.name || i.quantity || i.unit), photos };
    setSubmitting(true);
    try {
      // Use multipart if photos exist
      if (photos.length > 0) {
        const form = new FormData();
        form.append('date', payload.date);
        form.append('menuName', payload.menuName);
        if (payload.notes) form.append('notes', payload.notes);
        form.append('ingredients', JSON.stringify(payload.ingredients));
        photos.forEach((p, idx) => {
          // @ts-ignore RN FormData file
          form.append('photos', { uri: p.uri, name: p.name || `photo_${idx + 1}.jpg`, type: p.type || 'image/jpeg' } as any);
        });
        await api('/catering/menu-qc', { method: 'POST', body: form });
      } else {
        await api('/catering/menu-qc', { method: 'POST', body: payload as any });
      }
      Alert.alert('Tersimpan', 'Data menu harian & QC berhasil dikirim.');
      // Reset form
      setMenuName('');
      setNotes('');
      setIngredients([{ name: '', quantity: '', unit: '' }]);
      setPhotos([]);
    } catch {
      // Offline or error -> queue locally
      try {
        const key = 'menu_qc_queue';
        const existingRaw = await (await import('../../../services/storage')).storage.get<any[]>(key);
        const queue = Array.isArray(existingRaw) ? existingRaw : [];
        queue.push(payload);
        await (await import('../../../services/storage')).storage.set(key, queue);
        Alert.alert('Disimpan offline', 'Tidak bisa terhubung ke server. Data disimpan dan akan disinkron saat online.');
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

        <View className="mb-3">
          <Text className="mb-1 text-gray-700">Tanggal Produksi (YYYY-MM-DD)</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="2025-10-25" keyboardType="numbers-and-punctuation" />
        </View>

        <View className="mb-3">
          <Text className="mb-1 text-gray-700">Nama Menu</Text>
          <TextInput value={menuName} onChangeText={setMenuName} placeholder="Contoh: Nasi Ayam Teriyaki" />
        </View>

        <View className="mb-3">
          <Text className="mb-2 text-gray-700">Bahan Baku</Text>
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
          <Text className="mb-1 text-gray-700">Catatan (opsional)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Catatan QC, suhu penyajian, dll." multiline numberOfLines={3} />
        </View>

        <View className="mb-3">
          <Text className="mb-2 text-gray-700">Dokumentasi (foto, opsional)</Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            {photos.map((p, idx) => (
              <Image key={idx} source={{ uri: p.uri }} style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: '#e5e7eb' }} />
            ))}
          </View>
          <Button title="Pilih foto" variant="secondary" onPress={pickImage} />
          {!isOnline && <Text className="text-orange-600 mt-2">Anda sedang offline. Kiriman akan diantrikan.</Text>}
        </View>

        <Button title={submitting ? 'Menyimpan…' : 'Simpan'} onPress={submit} loading={submitting} disabled={!isValid || submitting} className="mt-2" />
      </Card>
    </ScrollView>
  );
}
