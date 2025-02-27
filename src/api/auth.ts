import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Define the base URL for the API
const API_URL = 'https://api.yourquranapp.com'

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Authentication API functions
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  } catch (error) {
    console.error('Login API error:', error)
    throw error
  }
}

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  try {
    const response = await api.post('/auth/register', { name, email, password })
    return response.data
  } catch (error) {
    console.error('Register API error:', error)
    throw error
  }
}

export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  } catch (error) {
    console.error('Forgot password API error:', error)
    throw error
  }
}

export const resetPassword = async (token: string, password: string) => {
  try {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  } catch (error) {
    console.error('Reset password API error:', error)
    throw error
  }
}

export const refreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('No refresh token available')

    const response = await api.post('/auth/refresh-token', { refreshToken })

    // Store the new tokens
    await AsyncStorage.setItem('userToken', response.data.token)
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken)

    return response.data
  } catch (error) {
    console.error('Refresh token API error:', error)
    throw error
  }
}

export const verifyEmail = async (
  email: string,
  otpCode: string,
): Promise<any> => {
  try {
    const response = await api.post('/auth/verify-email', { email, otpCode })
    return response.data
  } catch (error) {
    console.error('Email verification error:', error)
    throw error
  }
}

export const verifyResetCode = async (
  email: string,
  otpCode: string,
): Promise<any> => {
  try {
    const response = await api.post('/auth/verify-reset-code', {
      email,
      otpCode,
    })
    return response.data
  } catch (error) {
    console.error('Reset code verification error:', error)
    throw error
  }
}

export const resendVerificationCode = async (email: string): Promise<any> => {
  try {
    const response = await api.post('/auth/resend-verification', { email })
    return response.data
  } catch (error) {
    console.error('Resend verification code error:', error)
    throw error
  }
}

export default api
