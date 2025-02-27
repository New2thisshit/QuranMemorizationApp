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
import AuthScreen from '../screens/auth/AuthScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen'

// Define auth stack param list
type AuthStackParamList = {
  Auth: undefined
  ForgotPassword: { email: string }
  OTPVerification: { email: string; mode: 'register' | 'password-reset' }
}

const Stack = createStackNavigator<AuthStackParamList>()

/**
 * AuthNavigator manages the authentication flow screens, including login,
 * registration, password reset, and any verification steps.
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Reset Password',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#333333',
          },
          headerTintColor: '#2E8B57',
        }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{
          headerShown: true,
          headerTitle: 'Verification',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#333333',
          },
          headerTintColor: '#2E8B57',
        }}
      />
    </Stack.Navigator>
  )
}

export default AuthNavigator
