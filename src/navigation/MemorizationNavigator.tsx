import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

// Import screens
import MemorizationScreen from '../screens/memorization/MemorizationScreen'
import ReciteScreen from '../screens/memorization/ReciteScreen'
import SurahListScreen from '../screens/memorization/SurahListScreen'
import AyahListScreen from '../screens/memorization/AyahListScreen'
import QuranViewScreen from '../screens/memorization/QuranViewScreen'
import QuranDisplaySettingsScreen from '../screens/settings/QuranDisplaySettingsScreen'

// Import types
import { MemorizationStackParamList } from '../types/navigation'

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
        name="QuranView"
        component={QuranViewScreen}
        options={{ title: 'Quran' }}
      />
      <Stack.Screen
        name="QuranSettings"
        component={QuranDisplaySettingsScreen}
        options={{ title: 'Quran Display Settings' }}
      />

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
