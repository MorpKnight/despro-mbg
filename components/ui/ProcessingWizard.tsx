import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Button from './Button';
import TextInput from './TextInput';
import type { ProcessingStep } from '../../services/emergency';

interface ProcessingWizardProps {
    visible: boolean;
    currentStep: ProcessingStep;
    reportTitle: string;
    onClose: () => void;
    onProcess: (step: ProcessingStep, notes: string) => Promise<void>;
}

const STEP_CONFIG: Record<
    ProcessingStep,
    {
        label: string;
        description: string;
        icon: keyof typeof Ionicons.glyphMap;
        color: string;
        nextStep?: ProcessingStep;
    }
> = {
    unprocessed: {
        label: 'Belum Diproses',
        description: 'Laporan baru masuk',
        icon: 'mail-unread',
        color: '#f59e0b',
    },
    verifikasi: {
        label: 'Verifikasi',
        description: 'Memastikan informasi dari pihak sekolah',
        icon: 'checkmark-circle',
        color: '#3b82f6',
        nextStep: 'audit',
    },
    audit: {
        label: 'Audit Catering',
        description: 'Melakukan audit ke catering terkait',
        icon: 'search',
        color: '#8b5cf6',
        nextStep: 'solusi',
    },
    solusi: {
        label: 'Update & Solusi',
        description: 'Memberikan solusi dan rekomendasi',
        icon: 'construct',
        color: '#06b6d4',
        nextStep: 'completed',
    },
    completed: {
        label: 'Selesai',
        description: 'Kasus telah ditangani',
        icon: 'checkmark-done-circle',
        color: '#10b981',
    },
};

export default function ProcessingWizard({
    visible,
    currentStep,
    reportTitle,
    onClose,
    onProcess,
}: ProcessingWizardProps) {
    const [selectedStep, setSelectedStep] = useState<ProcessingStep | null>(null);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const config = STEP_CONFIG[currentStep];
    const nextStepValue = config.nextStep;

    const handleProcess = async () => {
        if (!selectedStep || !notes.trim()) return;

        try {
            setProcessing(true);
            await onProcess(selectedStep, notes);
            setNotes('');
            setSelectedStep(null);
            onClose();
        } catch (err) {
            console.error('[wizard] process failed', err);
            alert('Gagal memproses laporan. Silakan coba lagi.');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        if (!processing) {
            setNotes('');
            setSelectedStep(null);
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl max-h-[85%]">
                    <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
                        <View className="flex-1 pr-4">
                            <Text className="text-lg font-bold text-gray-900">Proses Laporan</Text>
                            <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                                {reportTitle}
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleClose}
                            disabled={processing}
                            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </Pressable>
                    </View>

                    <ScrollView className="flex-1">
                        <View className="p-6 gap-6">
                            {/* Current Step Display */}
                            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                <View className="flex-row items-center gap-3 mb-2">
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center"
                                        style={{ backgroundColor: config.color }}
                                    >
                                        <Ionicons name={config.icon} size={24} color="#FFFFFF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs font-semibold text-gray-600 uppercase mb-1">Status Saat Ini</Text>
                                        <Text className="text-base font-bold text-gray-900">{config.label}</Text>
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-700">{config.description}</Text>
                            </View>

                            {/* Step Selection */}
                            <View>
                                <Text className="text-base font-bold text-gray-900 mb-3">Pilih Langkah Selanjutnya</Text>
                                <View className="gap-3">
                                    {nextStepValue && (
                                        <Pressable
                                            onPress={() => setSelectedStep(nextStepValue)}
                                            disabled={processing}
                                            className={`border-2 rounded-2xl p-4 ${selectedStep === nextStepValue
                                                ? 'border-primary-blue bg-blue-50'
                                                : 'border-gray-200 bg-white'
                                                }`}
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <View
                                                    className="w-10 h-10 rounded-full items-center justify-center"
                                                    style={{ backgroundColor: STEP_CONFIG[nextStepValue].color }}
                                                >
                                                    <Ionicons name={STEP_CONFIG[nextStepValue].icon} size={20} color="#FFFFFF" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-sm font-bold text-gray-900">
                                                        {STEP_CONFIG[nextStepValue].label}
                                                    </Text>
                                                    <Text className="text-xs text-gray-600">{STEP_CONFIG[nextStepValue].description}</Text>
                                                </View>
                                                {selectedStep === nextStepValue && <Ionicons name="checkmark-circle" size={24} color="#1976D2" />}
                                            </View>
                                        </Pressable>
                                    )}

                                    <Pressable
                                        onPress={() => setSelectedStep('completed')}
                                        disabled={processing}
                                        className={`border-2 rounded-2xl p-4 ${selectedStep === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                                            }`}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center">
                                                <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-sm font-bold text-gray-900">Tandai Selesai</Text>
                                                <Text className="text-xs text-gray-600">Kasus telah ditangani sepenuhnya</Text>
                                            </View>
                                            {selectedStep === 'completed' && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                                        </View>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Notes Input */}
                            {selectedStep && (
                                <View>
                                    <Text className="text-base font-bold text-gray-900 mb-2">Catatan *</Text>
                                    <TextInput
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder="Jelaskan tindakan yang dilakukan..."
                                        multiline
                                        numberOfLines={4}
                                        className="min-h-[100px]"
                                    />
                                    <Text className="text-xs text-gray-500 mt-1">
                                        Catatan ini akan disimpan dalam riwayat follow-up laporan
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View className="p-6 border-t border-gray-200 gap-3">
                        <Button
                            title={processing ? 'Memproses...' : 'Proses Laporan'}
                            onPress={handleProcess}
                            loading={processing}
                            icon={processing ? undefined : <Ionicons name="arrow-forward" size={20} color="white" />}
                            fullWidth
                        />
                        <Button title="Batal" variant="outline" onPress={handleClose} disabled={processing} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
