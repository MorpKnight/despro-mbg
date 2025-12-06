import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Chip } from '../../../components/ui/Chip';
import { OfflineBadge } from '../../../components/ui/OfflineBadge';
import TextInput from '../../../components/ui/TextInput';
import UploadImage from '../../../components/ui/UploadImage'; // [BARU]
import { useAuth } from '../../../hooks/useAuth';
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

  // [UBAH] photos state sekarang array of string URL
  const [photos, setPhotos] = useState<string[]>([]);
  // [BARU] Key untuk mereset komponen UploadImage setelah sukses upload
  const [uploadKey, setUploadKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [pickerExpanded, setPickerExpanded] = useState(Platform.OS === 'ios');

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

  // [BARU] Handler ketika upload CDN sukses
  const handlePhotoUploaded = (url: string) => {
    setPhotos(prev => [...prev, url]);
    setUploadKey(prev => prev + 1); // Reset uploader component
  };

  // [BARU] State untuk sekolah
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const { user } = useAuth(); // Asumsi useAuth export user dengan catering_id
  console.log('MenuQCForm user:', user); // DEBUG

  // [BARU] Fetch associated schools
  useEffect(() => {
    async function fetchSchools() {
      if (!user?.cateringId) return;
      setLoadingSchools(true);
      try {
        const res = await api(`caterings/${user.cateringId}/schools`);
        setSchools(res);
        // Default select all schools? Or empty? Let's default to empty or all.
        // Selecting all by default is convenient.
        setSchools(res);
        if (Array.isArray(res)) {
          setSelectedSchoolIds(res.map((s: any) => s.id));
        }
      } catch (error) {
        console.error('Failed to fetch schools', error);
      } finally {
        setLoadingSchools(false);
      }
    }
    fetchSchools();
  }, [user?.cateringId]);

  function toggleSchool(id: string) {
    setSelectedSchoolIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  }

  const submit = handleSubmit(async (values) => {
    if (submitting) return;

    if (selectedSchoolIds.length === 0) {
      Alert.alert('Pilih Sekolah', 'Harap pilih minimal satu sekolah penerima menu.');
      return;
    }

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
      photos, // Array URL
    });

    setSubmitting(true);
    try {
      // [UBAH] Kirim JSON payload karena foto sudah berupa URL
      const body = {
        nama_menu: payload.menuName,
        tanggal: payload.date,
        ingredients: payload.ingredients,
        notes: payload.notes,
        photos: payload.photos, // Array string URL
        school_ids: selectedSchoolIds // [BARU]
      };

      await api('menus/', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      showSnackbar({ message: 'Menu harian & QC berhasil dikirim.', variant: 'success' });
      reset({
        date: values.date,
        menuName: '',
        notes: '',
        ingredients: [{ ...EMPTY_INGREDIENT }],
      });
      setPhotos([]);
      // Select all again for next input? or keep selection.
    } catch (e) {
      console.warn('Submit error', e);
      // Offline queueing logic
      try {
        const key = 'menu_qc_queue';
        const existingRaw = await (await import('../../../services/storage')).storage.get<any[]>(key);
        const queue = Array.isArray(existingRaw) ? existingRaw : [];
        // Add school_ids to offline payload too? 
        // MenuQCEntry needs update if we strictly check types.
        // For now, payload holds form data. We should probably merge body logic here.
        // Let's assume offline queue saves the constructed body or similar.
        // actually existing code pushes `payload`. `payload` (MenuQCEntry) doesn't have school_ids.
        // I should stick school_ids onto payload or body.
        const offlinePayload = { ...payload, school_ids: selectedSchoolIds };
        queue.push(offlinePayload);

        await (await import('../../../services/storage')).storage.set(key, queue);
        showSnackbar({ message: 'Anda offline atau gagal. Data diantrikan.', variant: 'info' });
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
        icon={<Ionicons name="school" size={22} color="#8B5CF6" />}
        title="Distribusi Sekolah"
        subtitle="Pilih sekolah yang menerima menu ini."
      >
        <View className="flex-row flex-wrap gap-2">
          {loadingSchools ? (
            <Text className="text-gray-500 italic">Memuat sekolah...</Text>
          ) : schools.length === 0 ? (
            <Text className="text-gray-500 italic">Tidak ada data sekolah terhubung.</Text>
          ) : (
            schools.map((school) => (
              <Chip
                key={school.id}
                label={school.name}
                active={selectedSchoolIds.includes(school.id)}
                onPress={() => toggleSchool(school.id)}
              />
            ))
          )}
        </View>
        {selectedSchoolIds.length === 0 && !submitting && !loadingSchools && schools.length > 0 && (
          <Text className="text-xs text-red-500 mt-2">Wajib pilih minimal satu sekolah.</Text>
        )}
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

        {/* Render foto yang SUDAH diupload ke CDN */}
        <View className="flex-row flex-wrap gap-3 mb-3">
          {photos.map((url, idx) => (
            <View key={url} className="relative">
              <Image
                source={{ uri: url }}
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
            </View>
          ))}
        </View>

        {/* Komponen Upload untuk menambah foto baru */}
        {canAddMorePhotos && (
          <UploadImage
            key={uploadKey} // Hack untuk reset state internal UploadImage setelah sukses
            label="Tambah Foto Baru"
            onUploaded={handlePhotoUploaded}
            disabled={submitting}
          />
        )}
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
      </Card>
    </ScrollView>
  );
}