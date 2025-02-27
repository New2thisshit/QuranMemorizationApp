import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'

// Components
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import ForgotPasswordForm from './components/ForgotPasswordForm'

// Assets and constants
const { width, height } = Dimensions.get('window')

/**
 * AuthScreen serves as the main authentication gateway for the application.
 * It provides a tabbed interface for login, registration, and password recovery.
 */
const AuthScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation()

  // State to track active form
  const [activeForm, setActiveForm] = useState<'login' | 'register' | 'forgot'>(
    'login',
  )

  // Function to change the active form
  const switchForm = (form: 'login' | 'register' | 'forgot') => {
    setActiveForm(form)
  }

  // Render the appropriate form based on state
  const renderForm = () => {
    switch (activeForm) {
      case 'login':
        return (
          <LoginForm
            onRegisterPress={() => switchForm('register')}
            onForgotPress={() => switchForm('forgot')}
          />
        )
      case 'register':
        return <RegisterForm onLoginPress={() => switchForm('login')} />
      case 'forgot':
        return <ForgotPasswordForm onBackPress={() => switchForm('login')} />
      default:
        return (
          <LoginForm
            onRegisterPress={() => switchForm('register')}
            onForgotPress={() => switchForm('forgot')}
          />
        )
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* App Logo and Header Section */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../../../assets/images/quran-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Quran Memorizer</Text>
            <Text style={styles.tagline}>
              Master the words of Allah with AI-powered guidance
            </Text>
          </View>

          {/* Form Tabs */}
          {activeForm !== 'forgot' && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeForm === 'login' && styles.activeTab]}
                onPress={() => switchForm('login')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeForm === 'login' && styles.activeTabText,
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeForm === 'register' && styles.activeTab,
                ]}
                onPress={() => switchForm('register')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeForm === 'register' && styles.activeTabText,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formContainer}>{renderForm()}</View>

          {/* App Information Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText} onPress={() => {}}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.linkText} onPress={() => {}}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57', // Islamic green
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 40,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
  },
  activeTab: {
    borderBottomColor: '#2E8B57',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999999',
  },
  activeTabText: {
    color: '#2E8B57',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  infoContainer: {
    padding: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  linkText: {
    color: '#2E8B57',
    fontWeight: '500',
  },
})

export default AuthScreen
