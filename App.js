import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import DashboardScreen from './src/screens/DashboardScreen';
import ImageEditorScreen from './src/screens/ImageEditorScreen';
import SkiaShapesExample from './src/screens/SkiaShapesExample';
import SkottieExample from './src/screens/SkottieExample';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: { backgroundColor: '#111' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ImageEditor"
            component={ImageEditorScreen}
            options={{ title: 'Enhance Image' }}
          />
          <Stack.Screen
            name="SkiaShapes"
            component={SkiaShapesExample}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Skottie"
            component={SkottieExample}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
