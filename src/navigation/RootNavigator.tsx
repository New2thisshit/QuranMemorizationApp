import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../contexts/AuthContext'

import {
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native'
import { MemorizationStackParamList } from '../types/navigation'

// In your screen components:
const navigation = useNavigation<NavigationProp<MemorizationStackParamList>>()

// Import navigators
import AuthNavigator from './AuthNavigator'
import AppNavigator from './AppNavigator'

// Define root stack param list
type RootStackParamList = {
  Auth: undefined
  App: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

interface RootNavigatorProps {
  initialRouteName: keyof RootStackParamList
}

const RootNavigator: React.FC<RootNavigatorProps> = ({ initialRouteName }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    // Return a loading screen
    return null
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'App' : 'Auth'}
      screenOptions={{ headerShown: false }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  )
}

export default RootNavigator
