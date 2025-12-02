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
    const [centralApiKey, setCentralApiKeyState] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Load Central API Key when modal opens
    useEffect(() => {
        if (visible) {
            import('../../services/storage').then(({ getCentralApiKey }) => {
                getCentralApiKey().then((key) => {
                    if (key) setCentralApiKeyState(key);
                });
            });
        }
    }, [visible]);

    const handleTestConnection = async () => {
        if (!serverUrl.trim()) {
            setTestStatus('error');
            setTestMessage('Server URL is required');
            return;
        }

        if (!centralApiKey.trim()) {
            setTestStatus('error');
            setTestMessage('Central API Key is required');
            return;
        }

        try {
            setTestStatus('testing');
            setTestMessage('Testing connection...');

            const response = await fetch(`${serverUrl.replace(/\/$/, '')}/central-sync/check-auth`, {
                method: 'GET',
                headers: {
                    'X-School-Token': centralApiKey.trim(),
                },
            });

            if (response.ok) {
                setTestStatus('success');
                setTestMessage('Connection successful! You can now save the configuration.');
            } else {
                setTestStatus('error');
                setTestMessage(`Server returned ${response.status}. Please check your credentials.`);
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error?.message || 'Could not connect to server. Please check the URL.');
        }
    };

    const handleSaveConfiguration = async () => {
        if (testStatus !== 'success') {
            Alert.alert('Test Required', 'Please test the connection before saving.');
            return;
        }

        try {
            setIsSaving(true);

            // Import storage functions
            const { setCentralApiKey: saveCentralApiKey } = await import('../../services/storage');

            // Save both server URL and Central API Key
            await onSave(); // This saves the server URL
            await saveCentralApiKey(centralApiKey.trim());

            Alert.alert('Success', 'Central Server configuration saved successfully!');
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

                    {/* Central API Key Section */}
                    <View className="mb-4">
                        <Text className="text-gray-600 mb-2 font-medium">Central API Key (Edge Mode)</Text>
                        <TextInput
                            value={centralApiKey}
                            onChangeText={(text) => {
                                setCentralApiKeyState(text);
                                if (testStatus !== 'idle') {
                                    setTestStatus('idle');
                                    setTestMessage('');
                                }
                            }}
                            placeholder="sk_..."
                            autoCapitalize="none"
                            secureTextEntry
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        />
                        <Text className="text-xs text-gray-500 mt-1">
                            Required for Edge Mode to sync with Central Server
                        </Text>
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
                            disabled={testStatus === 'testing' || !serverUrl.trim() || !centralApiKey.trim()}
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
                                    disabled={testStatus !== 'success' || isSaving}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
