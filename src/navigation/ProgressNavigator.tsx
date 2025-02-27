import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import {
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native'
import { MemorizationStackParamList } from '../types/navigation'

// In your screen components:
const navigation = useNavigation<NavigationProp<MemorizationStackParamList>>()

// Import screens
import ProgressScreen from '../screens/progress/ProgressScreen'
import StatsScreen from '../screens/progress/StatsScreen'
import RecitationHistoryScreen from '../screens/progress/RecitationHistoryScreen'
import SurahDetailScreen from '../screens/progress/SurahDetailScreen'

// Define progress stack param list
type ProgressStackParamList = {
  ProgressMain: undefined
  Stats: undefined
  RecitationHistory: undefined
  SurahDetail: { surahId: number }
}

const Stack = createStackNavigator<ProgressStackParamList>()

/**
 * ProgressNavigator provides navigation between different progress tracking screens.
 * This navigator manages the flow between the main progress overview, detailed statistics,
 * recitation history, and surah-specific progress details.
 */
const ProgressNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProgressMain"
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
        name="ProgressMain"
        component={ProgressScreen}
        options={{ title: 'My Progress' }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: 'Detailed Statistics' }}
      />
      <Stack.Screen
        name="RecitationHistory"
        component={RecitationHistoryScreen}
        options={{ title: 'Recitation History' }}
      />
      <Stack.Screen
        name="SurahDetail"
        component={SurahDetailScreen}
        options={({ route }) => ({
          title: `Surah ${route.params.surahId} Progress`,
        })}
      />
    </Stack.Navigator>
  )
}

export default ProgressNavigator
