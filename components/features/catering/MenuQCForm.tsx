import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Chip } from '../../../components/ui/Chip';
import { OfflineBadge } from '../../../components/ui/OfflineBadge';
import TextInput from '../../../components/ui/TextInput';
import { useOffline } from '../../../hooks/useOffline';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { formatDate } from '../../../lib/utils';
import type { IngredientInput, MenuQCEntry, MenuQCFormValues, MenuQCIngredientPayload } from '../../../schemas/menuQc';
import { MenuQCEntrySchema, MenuQCFormSchema } from '../../../schemas/menuQc';
import { api } from '../../../services/api';

const todayStr = () => formatDate(new Date());
const tomorrowStr = () => formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
const EMPTY_INGREDIENT: IngredientInput = { name: '', quantity: '', unit: '' };
const COMMON_UNITS = ['kg', 'gram', 'pcs', 'paket', 'ml', 'liter'];
const MAX_PHOTOS = 5;

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, children }: SectionProps) {
  return (
    <Card>
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">{icon}</View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          {subtitle ? <Text className="text-sm text-gray-500">{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

export default function MenuQCForm() {
  const { isOnline } = useOffline();
  const { showSnackbar } = useSnackbar();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<MenuQCFormValues>({
    resolver: zodResolver(MenuQCFormSchema),
    defaultValues: {
      date: todayStr(),
      menuName: '',
      notes: '',
      ingredients: [{ ...EMPTY_INGREDIENT }],
    },
    mode: 'onChange',
  });
  const { fields: ingredientFields, append, remove: removeIngredientField } = useFieldArray({ control, name: 'ingredients' });
  const date = watch('date');
  const ingredients = watch('ingredients');
  const [photos, setPhotos] = useState<MenuQCEntry['photos']>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pickerExpanded, setPickerExpanded] = useState(Platform.OS === 'ios');
  const [uploadProgress, setUploadProgress] = useState(0);

  const dateShortcuts = useMemo(
    () => [
      { label: 'Hari ini', value: todayStr() },
      { label: 'Besok', value: tomorrowStr() },
      { label: 'Lusa', value: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) },
    ],
    []
  );

  const canAddMorePhotos = photos.length < MAX_PHOTOS;
  const photosRemaining = MAX_PHOTOS - photos.length;

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

  function updateIngredient(i: number, patch: Partial<IngredientInput>) {
    const current = ingredients?.[i] ?? EMPTY_INGREDIENT;
    setValue(`ingredients.${i}`, { ...current, ...patch }, { shouldDirty: true, shouldValidate: true });
  }

  function addIngredient() {
    append({ ...EMPTY_INGREDIENT });
  }

  function removeIngredient(i: number) {
    if (ingredientFields.length <= 1) return;
    removeIngredientField(i);
  }

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setValue('date', formatDate(selected), { shouldValidate: true });
    }
    if (Platform.OS !== 'ios') {
      setPickerExpanded(false);
    }
  };

  const openDatePicker = () => {
    const current = date ? new Date(date) : new Date();
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
    if (!canAddMorePhotos) {
      Alert.alert('Batas foto tercapai', `Maksimal ${MAX_PHOTOS} foto per menu.`);
      return;
    }
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

  async function captureImage() {
    if (!canAddMorePhotos) {
      Alert.alert('Batas foto tercapai', `Maksimal ${MAX_PHOTOS} foto per menu.`);
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
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
        console.warn('[menu-qc] gagal kompres gambar kamera', error);
      }
      setPhotos((prev) => [
        ...prev,
        { uri: optimizedUri, name: asset.fileName || `photo_${prev.length + 1}.jpg`, type: asset.mimeType || 'image/jpeg' },
      ]);
    }
  }

  const submit = handleSubmit(async (values) => {
    if (submitting) return;

    const preparedIngredients: MenuQCIngredientPayload[] = values.ingredients.map((item) => ({
      name: item.name.trim(),
      unit: item.unit.trim(),
      quantity: Number(item.quantity),
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

    const payload: MenuQCEntry = MenuQCEntrySchema.parse({
      date: values.date,
      menuName: values.menuName.trim(),
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      ingredients: preparedIngredients,
      photos,
    });

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
      reset({
        date: values.date,
        menuName: '',
        notes: '',
        ingredients: [{ ...EMPTY_INGREDIENT }],
      });
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
      } catch { }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Card>
        <Text className="text-xl font-bold text-gray-900">Input Menu Harian & QC</Text>
        <Text className="text-gray-600 mt-1">Isi detail menu, bahan baku, dan dokumentasi untuk memastikan kepatuhan MBG.</Text>
        <View className="flex-row items-center justify-between mt-4">
          <OfflineBadge isOnline={isOnline} />
          <Text className="text-xs text-gray-500">Terakhir diperbarui {new Date().toLocaleTimeString('id-ID')}</Text>
        </View>
      </Card>

      <Section
        icon={<Ionicons name="calendar" size={22} color="#2563EB" />}
        title="Detail Menu"
        subtitle="Pilih tanggal produksi dan beri nama menu utama."
      >
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
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 flex-row">
            {dateShortcuts.map((shortcut) => (
              <Chip
                key={shortcut.value}
                label={shortcut.label}
                active={date === shortcut.value}
                onPress={() => setValue('date', shortcut.value, { shouldValidate: true })}
                className="mr-2"
              />
            ))}
          </ScrollView>
          {errors.date ? <Text className="text-xs text-red-500 mt-2">{errors.date.message}</Text> : null}
        </View>

        <View>
          <Text className="mb-1 text-gray-800">Nama Menu</Text>
          <Controller
            control={control}
            name="menuName"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Contoh: Nasi Ayam Teriyaki" />
            )}
          />
          {errors.menuName ? <Text className="text-xs text-red-500 mt-1">{errors.menuName.message}</Text> : null}
          <Text className="text-xs text-gray-500 mt-1">Pastikan nama menu sesuai dengan yang akan tampil di portal orang tua.</Text>
        </View>
      </Section>

      <Section
        icon={<Ionicons name="list" size={22} color="#0D9488" />}
        title="Bahan Baku"
        subtitle="Catat seluruh bahan dengan kuantitas dan satuan."
      >
        {ingredientFields.map((field, idx) => {
          const ingErrors = errors.ingredients?.[idx];
          const current = ingredients?.[idx] ?? EMPTY_INGREDIENT;
          return (
            <View key={field.id} className="mb-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-gray-800">Bahan #{idx + 1}</Text>
                {ingredientFields.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(idx)}
                    className="px-2 py-1 rounded-full bg-red-50"
                    accessibilityLabel="Hapus bahan"
                  >
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="trash" size={14} color="#DC2626" />
                      <Text className="text-xs font-semibold text-red-600">Hapus</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row gap-2 mb-2">
                <View style={{ flex: 2 }}>
                  <Controller
                    control={control}
                    name={`ingredients.${idx}.name` as const}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Nama bahan" />
                    )}
                  />
                  {ingErrors?.name ? <Text className="text-xs text-red-500 mt-1">{ingErrors.name.message}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name={`ingredients.${idx}.quantity` as const}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Qty"
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {ingErrors?.quantity ? <Text className="text-xs text-red-500 mt-1">{ingErrors.quantity.message}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name={`ingredients.${idx}.unit` as const}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Satuan" />
                    )}
                  />
                  {ingErrors?.unit ? <Text className="text-xs text-red-500 mt-1">{ingErrors.unit.message}</Text> : null}
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                {COMMON_UNITS.map((unit) => (
                  <Chip
                    key={`${field.id}-${unit}`}
                    label={unit}
                    active={current.unit.trim().toLowerCase() === unit}
                    onPress={() => updateIngredient(idx, { unit })}
                    className="mx-1"
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
        <Button title="Tambah bahan" variant="secondary" onPress={addIngredient} />
      </Section>

      <Section
        icon={<Ionicons name="document-text" size={22} color="#F97316" />}
        title="Catatan & Dokumentasi"
        subtitle="Tambahkan catatan QC serta dokumentasi visual."
      >
        <View className="mb-4">
          <Text className="mb-1 text-gray-800">Catatan (opsional)</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Catatan QC, suhu penyajian, catatan alergi, dll."
                multiline
                numberOfLines={4}
              />
            )}
          />
          {errors.notes ? <Text className="text-xs text-red-500 mt-1">{errors.notes.message}</Text> : null}
        </View>

        <Text className="mb-2 text-gray-800">Dokumentasi Foto</Text>
        <Text className="text-xs text-gray-500 mb-3">Anda dapat menambahkan hingga {MAX_PHOTOS} foto (sisa {photosRemaining}).</Text>
        <View className="flex-row flex-wrap gap-3 mb-3">
          {photos.map((p, idx) => (
            <View key={idx} className="relative">
              <Image
                source={{ uri: p.uri }}
                style={{ width: 96, height: 96, borderRadius: 14, backgroundColor: '#e5e7eb' }}
                contentFit="cover"
                transition={500}
                cachePolicy="memory-disk"
              />
              <TouchableOpacity
                className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1"
                onPress={() => removePhoto(idx)}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
              {submitting && (
                <View className="absolute inset-0 bg-black/30 rounded-2xl items-center justify-center">
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
          ))}
          {photos.length === 0 && (
            <View className="w-full border border-dashed border-gray-300 rounded-2xl p-4 items-center">
              <Ionicons name="image" size={28} color="#9CA3AF" />
              <Text className="text-sm text-gray-500 mt-1">Belum ada foto</Text>
            </View>
          )}
        </View>
        <View className="flex-row gap-2">
          <Button title="Ambil Foto" variant="secondary" onPress={captureImage} disabled={!canAddMorePhotos} className="flex-1" />
          <Button title="Pilih dari Galeri" variant="secondary" onPress={pickImage} disabled={!canAddMorePhotos} className="flex-1" />
        </View>
      </Section>

      <Card variant="elevated" className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-semibold text-gray-900">Kirim Laporan</Text>
            <Text className="text-sm text-gray-500">Pastikan seluruh data sudah tepat sebelum menyimpan.</Text>
          </View>
          <Ionicons name="cloud-upload-outline" size={24} color="#2563EB" />
        </View>
        <Button
          title={submitting ? 'Menyimpan…' : 'Simpan Menu & QC'}
          onPress={submit}
          loading={submitting}
          disabled={!isValid || submitting}
        />
        {!isValid && (
          <Text className="text-xs text-red-500 mt-2">Isi tanggal dan nama menu untuk mengaktifkan tombol simpan.</Text>
        )}
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
