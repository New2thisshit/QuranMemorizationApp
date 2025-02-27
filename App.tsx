import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'

// Contexts
import { AuthProvider } from './src/contexts/AuthContext'
import { QuranProvider } from './src/contexts/QuranContext'
import { RecitationProvider } from './src/contexts/RecitationContext'

// Navigation
import RootNavigator from './src/navigation/RootNavigator'

// Services
import { initializeDatabase } from './src/services/storage'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [initialRoute, setInitialRoute] = useState('Auth')

  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize the SQLite database
        await initializeDatabase()

        // Check if user is already logged in
        const userToken = await AsyncStorage.getItem('userToken')
        if (userToken) {
          setInitialRoute('App')
        }
      } catch (e) {
        console.warn('Error during app initialization:', e)
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
      <AuthProvider>
        <QuranProvider>
          <RecitationProvider>
            <NavigationContainer>
              <RootNavigator initialRouteName={initialRoute} />
              <StatusBar style="auto" />
            </NavigationContainer>
          </RecitationProvider>
        </QuranProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
