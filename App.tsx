// App.tsx
import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'
import DebuggingAssistant from './src/debug/DebuggingAssistant'

// Contexts
import { AuthProvider } from './src/contexts/AuthContext'
import { QuranProvider } from './src/contexts/QuranContext'
import { RecitationProvider } from './src/contexts/RecitationContext'
import { EnhancedQuranProvider } from './src/contexts/EnhancedQuranContext'

// Navigation
import RootNavigator from './src/navigation/RootNavigator'
import { RootStackParamList } from './src/types/navigation'

// Services - use mock service instead of real one
// import { initializeDatabase } from './src/services/storage'
import { initializeDatabase } from './src/services/mockStorage'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [initialRoute, setInitialRoute] = useState('Auth')

  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize the SQLite database (now using mock)
        await initializeDatabase()

        // Check if user is already logged in
        const userToken = await AsyncStorage.getItem('userToken')
        if (userToken) {
          setInitialRoute('App')
        }
      } catch (e) {
        console.warn('Error during app initialization:', e)
        // Show a user-friendly error instead of crashing
        Alert.alert(
          'Initialization Error',
          'There was an issue starting the app. Some features may be limited.',
          [{ text: 'OK' }],
        )
      } finally {
        setIsLoading(false)
      }
    }

    prepare()
  }, [])

  if (isLoading) {
    // You could return a splash screen here
    return null
  }

  return (
    <SafeAreaProvider>
      {/* <DebuggingAssistant /> */}
      <AuthProvider>
        <QuranProvider>
          <RecitationProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </RecitationProvider>
        </QuranProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
