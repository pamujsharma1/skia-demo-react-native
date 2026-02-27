import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AntigravityOrb from '../components/AntigravityOrb';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
    const navigation = useNavigation();

    // Function to request camera permissions and launch camera
    const pickFromCamera = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission needed', 'You need to grant camera permissions to use this feature.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                navigation.navigate('ImageEditor', { imageUri: result.assets[0].uri });
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    // Function to request media library permissions and launch picker
    const pickFromLibrary = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission needed', 'You need to grant photo library permissions to use this feature.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                navigation.navigate('ImageEditor', { imageUri: result.assets[0].uri });
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.orbWrapper}>
                <AntigravityOrb />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.title}>Antigravity Visuals</Text>
                <Text style={styles.subtitle}>Select an image to enhance</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={pickFromCamera}>
                        <Text style={styles.buttonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={pickFromLibrary}>
                        <Text style={styles.outlineButtonText}>Choose from Library</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.shapesButton]}
                        onPress={() => navigation.navigate('SkiaShapes')}
                    >
                        <Text style={styles.shapesButtonText}>View Shapes Example</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.skottieButton]}
                        onPress={() => navigation.navigate('Skottie')}
                    >
                        <Text style={styles.skottieButtonText}>View Skottie</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    orbWrapper: {
        height: 450,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subtitle: {
        color: '#888',
        fontSize: 16,
        letterSpacing: 1,
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    button: {
        backgroundColor: '#00ffff',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#00ffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#00ffff',
        shadowOpacity: 0,
        elevation: 0,
    },
    outlineButtonText: {
        color: '#00ffff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    shapesButton: {
        backgroundColor: '#bb86fc',
        shadowColor: '#bb86fc',
        marginTop: 10,
    },
    shapesButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    skottieButton: {
        backgroundColor: '#ff0055',
        shadowColor: '#ff0055',
        marginTop: 10,
    },
    skottieButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
