import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import TutorialScreen from './screens/TutorialScreen';
import PlayScreen from './screens/PlayScreen';
import DrawScreen from './screens/DrawScreen';
import ResultScreen from './screens/ResultScreen';
import GalleryScreen from './screens/GalleryScreen';

export type RootStackParamList = {
  Home: undefined;
  Tutorial: undefined;
  Play: undefined;
  Draw: { prompt: string };
  Result: { prompt: string; entryId: string };
  Gallery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Tutorial" component={TutorialScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Play" component={PlayScreen} />
        <Stack.Screen name="Draw" component={DrawScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
