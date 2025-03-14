// src/api/auth.ts
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import mock implementations
import * as mockApi from './mockApi'

// Define the base URL for the API
const API_URL = 'https://api.yourquranapp.com'

// Flag to use mock API instead of real API
const USE_MOCK_API = true

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
    if (USE_MOCK_API) {
      return await mockApi.login(email, password)
    }

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
    if (USE_MOCK_API) {
      return await mockApi.register(name, email, password)
    }

    const response = await api.post('/auth/register', { name, email, password })
    return response.data
  } catch (error) {
    console.error('Register API error:', error)
    throw error
  }
}

export const forgotPassword = async (email: string) => {
  try {
    if (USE_MOCK_API) {
      return await mockApi.forgotPassword(email)
    }

    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  } catch (error) {
    console.error('Forgot password API error:', error)
    throw error
  }
}

export const resetPassword = async (token: string, password: string) => {
  try {
    if (USE_MOCK_API) {
      return await mockApi.resetPassword(token, password)
    }

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

    if (USE_MOCK_API) {
      // Mock implementation of token refresh
      const newToken = 'mock-refreshed-token-' + Date.now()
      await AsyncStorage.setItem('userToken', newToken)
      return { token: newToken, refreshToken: refreshToken }
    }

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
    if (USE_MOCK_API) {
      return await mockApi.verifyEmail(email, otpCode)
    }

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
    if (USE_MOCK_API) {
      return await mockApi.verifyResetCode(email, otpCode)
    }

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
    if (USE_MOCK_API) {
      return await mockApi.resendVerificationCode(email)
    }

    const response = await api.post('/auth/resend-verification', { email })
    return response.data
  } catch (error) {
    console.error('Resend verification code error:', error)
    throw error
  }
}

export default api
