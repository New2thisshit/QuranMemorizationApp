import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StackNavigationProp } from '@react-navigation/stack'

// Import auth API
import * as authApi from '../../api/auth'

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  any,
  'ForgotPassword'
>

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp
}

/**
 * This is a standalone ForgotPasswordScreen that can be used with the AuthNavigator.
 * It offers similar functionality to the ForgotPasswordForm component but as a full screen.
 */
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  // Form state
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simple email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle password reset request
  const handleResetRequest = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // Call the forgot password API
      await authApi.forgotPassword(email)
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        email,
        mode: 'password-reset',
      })
    } catch (error) {
      console.error('Password reset request error:', error)
      Alert.alert(
        'Request Failed',
        'An error occurred while processing your request. Please try again later.',
        [{ text: 'OK' }],
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.description}>
            Enter the email address associated with your account, and we'll send
            you a verification code to reset your password.
          </Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                if (error) setError(null)
              }}
              editable={!isLoading}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleResetRequest}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('AuthMain')}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#F44336',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ForgotPasswordScreen
