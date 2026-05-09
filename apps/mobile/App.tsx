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
import LobbyScreen from './screens/LobbyScreen';
import WaitingRoomScreen from './screens/WaitingRoomScreen';
import MultiDrawScreen from './screens/MultiDrawScreen';
import RevealScreen from './screens/RevealScreen';
import VoteScreen from './screens/VoteScreen';
import MultiResultScreen from './screens/MultiResultScreen';

type VoteDrawing = { id: string; display_name: string; svg_data: string };

export type RootStackParamList = {
  Home: undefined;
  Tutorial: undefined;
  Play: undefined;
  Draw: { prompt: string };
  Result: { prompt: string; entryId: string };
  Gallery: undefined;
  Lobby: undefined;
  WaitingRoom: {
    matchId: string; roomCode: string; isHost: boolean; userId: string; username: string;
  };
  MultiDraw: {
    matchId: string; roomCode: string; userId: string; username: string;
    prompt: string; round: number; totalRounds: number; isHost: boolean;
  };
  Reveal: {
    matchId: string; roomCode: string; userId: string; username: string;
    prompt: string; round: number; totalRounds: number; isHost: boolean;
  };
  Vote: {
    matchId: string; roomCode: string; userId: string; username: string;
    prompt: string; round: number; totalRounds: number; isHost: boolean;
    drawings: VoteDrawing[];
  };
  MultiResult: {
    matchId: string; roomCode: string; userId: string; username: string;
    prompt: string; round: number; totalRounds: number; isHost?: boolean;
    drawings: VoteDrawing[]; votes: Record<string, string | null>;
  };
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
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="MultiDraw" component={MultiDrawScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Reveal" component={RevealScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Vote" component={VoteScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="MultiResult" component={MultiResultScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
