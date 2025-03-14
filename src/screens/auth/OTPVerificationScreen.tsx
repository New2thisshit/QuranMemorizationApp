import React, { useState, useRef, useEffect } from 'react'
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
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

// Import auth API
import * as authApi from '../../api/auth'

// Define route params type
type OTPVerificationRouteProp = RouteProp<
  {
    OTPVerification: { email: string; mode: 'register' | 'password-reset' }
  },
  'OTPVerification'
>

type OTPVerificationNavigationProp = StackNavigationProp<any, 'OTPVerification'>

interface OTPVerificationScreenProps {
  route: OTPVerificationRouteProp
  navigation: OTPVerificationNavigationProp
}

/**
 * OTPVerificationScreen handles verification codes sent via email
 * for account registration or password reset.
 */
const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  route,
  navigation,
}) => {
  const { email, mode } = route.params

  // OTP input state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)

  // References for TextInput focus management
  const inputRefs = useRef<Array<TextInput | null>>([])

  // Timer for resend cooldown
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true)
      return
    }

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timerId)
  }, [timeLeft])

  // Handle OTP input changes
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp]

    // Only allow numbers
    const formattedText = text.replace(/[^0-9]/g, '')

    if (formattedText.length > 1) {
      // If pasting multiple digits
      const pastedData = formattedText.split('')

      for (let i = 0; i < 6 && i < pastedData.length; i++) {
        newOtp[i] = pastedData[i]
      }

      setOtp(newOtp)

      // Focus on the last input or the next empty one
      const lastFilledIndex = Math.min(5, pastedData.length - 1)
      inputRefs.current[lastFilledIndex]?.focus()
    } else {
      // Normal single digit input
      newOtp[index] = formattedText
      setOtp(newOtp)

      // Auto-focus next input if this one is filled
      if (formattedText !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  // Handle backspace key for easier OTP entry
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      // If current field is empty and backspace is pressed, focus previous field
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Verify the entered OTP
  const verifyOtp = async () => {
    // Check if all OTP digits have been entered
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      Alert.alert(
        'Incomplete Code',
        'Please enter the 6-digit verification code',
      )
      return
    }

    setIsLoading(true)

    try {
      // Call the appropriate API based on mode
      if (mode === 'register') {
        await authApi.verifyEmail(email, otpString)
        Alert.alert(
          'Verification Successful',
          'Your email has been verified. You can now log in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('AuthMain'),
            },
          ],
        )
      } else {
        // Password reset flow
        await authApi.verifyResetCode(email, otpString)
        // Navigate to reset password screen (would need to be added)
        navigation.navigate('ResetPassword', { email, code: otpString })
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      Alert.alert(
        'Verification Failed',
        'The code you entered is incorrect or has expired. Please try again.',
        [{ text: 'OK' }],
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Resend verification code
  const resendCode = async () => {
    if (!canResend) return

    setIsLoading(true)

    try {
      if (mode === 'register') {
        await authApi.resendVerificationCode(email)
      } else {
        await authApi.forgotPassword(email)
      }

      // Reset timer
      setTimeLeft(60)
      setCanResend(false)

      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
        [{ text: 'OK' }],
      )
    } catch (error) {
      console.error('Resend code error:', error)
      Alert.alert(
        'Request Failed',
        'Failed to send a new code. Please try again later.',
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
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.description}>
            We've sent a verification code to{' '}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={verifyOtp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={resendCode} disabled={isLoading}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend in {timeLeft}s</Text>
          )}
        </View>
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
    paddingTop: 40,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#333333',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    color: '#333333',
    backgroundColor: '#F5F5F5',
  },
  verifyButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 8,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
})

export default OTPVerificationScreen
