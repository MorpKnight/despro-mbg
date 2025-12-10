import React, { useEffect, useState } from "react";
import { Alert, Modal, Text, TextInput, View } from "react-native";
import Button from "../ui/Button";

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    serverUrl: string;
    setServerUrl: (url: string) => void;
    onPing: () => void;
    onSave: () => void;
}

export const SettingsModal = ({ visible, onClose, serverUrl, setServerUrl, onPing, onSave }: SettingsModalProps) => {
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleTestConnection = async () => {
        if (!serverUrl.trim()) {
            setTestStatus('error');
            setTestMessage('Server URL is required');
            return;
        }

        if (!serverUrl.trim()) {
            setTestStatus('error');
            setTestMessage('Server URL is required');
            return;
        }

        try {
            setTestStatus('testing');
            setTestMessage('Testing connection...');

            const response = await fetch(`${serverUrl.replace(/\/$/, '')}/health`, {
                method: 'GET',
            });

            if (response.ok) {
                setTestStatus('success');
                setTestMessage('Connection successful! Server is reachable.');
            } else {
                setTestStatus('error');
                setTestMessage(`Server returned ${response.status}. Please check the URL.`);
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error?.message || 'Could not connect to server. Please check the URL.');
        }
    };

    const handleSaveConfiguration = async () => {
        if (!serverUrl.trim()) {
            Alert.alert('Error', 'Server URL is required');
            return;
        }

        // Test is no longer mandatory for saving
        // if (testStatus !== 'success') { ... } 

        try {
            setIsSaving(true);

            // Save server URL
            await onSave();

            Alert.alert('Success', 'Server configuration saved successfully!');
            onClose();

            // Reset state
            setTestStatus('idle');
            setTestMessage('');
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setTestStatus('idle');
        setTestMessage('');
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-xl">
                    <Text className="text-xl font-bold mb-4">Server Settings</Text>

                    {/* Server URL Section */}
                    <View className="mb-4">
                        <Text className="text-gray-600 mb-2 font-medium">Server URL</Text>
                        <TextInput
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            placeholder="http://..."
                            autoCapitalize="none"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        />
                    </View>



                    {/* Test Status Message */}
                    {testMessage ? (
                        <View className={`mb-4 p-3 rounded-lg ${testStatus === 'success' ? 'bg-green-50 border border-green-200' :
                            testStatus === 'error' ? 'bg-red-50 border border-red-200' :
                                'bg-blue-50 border border-blue-200'
                            }`}>
                            <Text className={`text-sm ${testStatus === 'success' ? 'text-green-700' :
                                testStatus === 'error' ? 'text-red-700' :
                                    'text-blue-700'
                                }`}>
                                {testMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* Action Buttons */}
                    <View className="gap-3">
                        <Button
                            title={testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                            variant="outline"
                            onPress={handleTestConnection}
                            disabled={testStatus === 'testing' || !serverUrl.trim()}
                        />

                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <Button
                                    title="Cancel"
                                    variant="outline"
                                    onPress={handleClose}
                                />
                            </View>
                            <View className="flex-1">
                                <Button
                                    title={isSaving ? 'Saving...' : 'Save'}
                                    onPress={handleSaveConfiguration}
                                    disabled={isSaving}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
