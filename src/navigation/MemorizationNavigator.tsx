import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

// Import screens
import MemorizationScreen from '../screens/memorization/MemorizationScreen'
import ReciteScreen from '../screens/memorization/ReciteScreen'
import SurahListScreen from '../screens/memorization/SurahListScreen'
import AyahListScreen from '../screens/memorization/AyahListScreen'

// Define memorization stack param list
type MemorizationStackParamList = {
  MemorizationMain: undefined
  SurahList: undefined
  AyahList: { surahId: number }
  Recite: { ayahId: number; surahId: number }
}

const Stack = createStackNavigator<MemorizationStackParamList>()

const MemorizationNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MemorizationMain"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f9f9f9',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MemorizationMain"
        component={MemorizationScreen}
        options={{ title: 'Quran Memorization' }}
      />
      <Stack.Screen
        name="SurahList"
        component={SurahListScreen}
        options={{ title: 'Select Surah' }}
      />
      <Stack.Screen
        name="AyahList"
        component={AyahListScreen}
        options={{ title: 'Select Ayah' }}
      />
      <Stack.Screen
        name="Recite"
        component={ReciteScreen}
        options={{ title: 'Recite & Record' }}
      />
    </Stack.Navigator>
  )
}

export default MemorizationNavigator
