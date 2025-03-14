// src/navigation/AuthNavigator.tsx
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

// Import screens
import AuthScreen from '../screens/auth/AuthScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen'
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen'

// Define auth stack param list - renamed "Auth" to "AuthMain" to avoid conflicts
type AuthStackParamList = {
  AuthMain: undefined // Changed from Auth to AuthMain
  ForgotPassword: { email: string }
  OTPVerification: { email: string; mode: 'register' | 'password-reset' }
  ResetPassword: { email: string; code: string }
}

const Stack = createStackNavigator<AuthStackParamList>()

/**
 * AuthNavigator manages the authentication flow screens, including login,
 * registration, password reset, and any verification steps.
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AuthMain" // Changed from Auth to AuthMain
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="AuthMain" component={AuthScreen} />
      {/* Changed from Auth to AuthMain */}
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
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
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
    </Stack.Navigator>
  )
}

export default AuthNavigator
