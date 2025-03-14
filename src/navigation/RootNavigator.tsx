// src/navigation/RootNavigator.tsx - FIXED VERSION
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../contexts/AuthContext'
import { ActivityIndicator, View } from 'react-native'

// Import navigators
import AuthNavigator from './AuthNavigator'
import AppNavigator from './AppNavigator'

// Import your navigation types
import { RootStackParamList } from '../types/navigation'

const Stack = createStackNavigator<RootStackParamList>()

/**
 * RootNavigator is the main navigator that decides whether to show
 * the authentication screens or the main app screens based on the user's
 * authentication state.
 */
const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    // Return a loading screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    )
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
