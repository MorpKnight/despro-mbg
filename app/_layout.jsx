import { StyleSheet, Text, View } from 'react-native'
import { Stack } from 'expo-router'

const RootLayout = () => {
    return (
        <View className = "flex-1" >
            <Stack />
            <Text>RootLayout</Text>
        </View>

    )
}

export default RootLayout

const styles = StyleSheet.create({})