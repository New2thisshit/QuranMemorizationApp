// src/api/mockApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock user data
const mockUsers = [
  {
    id: 'user1',
    name: 'Demo User',
    email: 'demo@example.com',
    // In a real app, never store plain passwords like this
    password: 'password123',
  },
]

// Mock authentication
export const login = async (email: string, password: string) => {
  console.log('Mock login with:', email)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = mockUsers.find((u) => u.email === email)

  if (!user || user.password !== password) {
    throw new Error('Invalid credentials')
  }

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
  }

  const response = {
    user: userData,
    token: 'mock-auth-token-' + Date.now(),
  }

  // Store the user data in AsyncStorage
  await AsyncStorage.setItem('user', JSON.stringify(userData))
  await AsyncStorage.setItem('userToken', response.token)

  return response
}

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  console.log('Mock register:', name, email)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  // Check if user already exists
  if (mockUsers.some((u) => u.email === email)) {
    throw new Error('User already exists')
  }

  // Create new user
  const newUser = {
    id: 'user' + (mockUsers.length + 1),
    name,
    email,
    password,
  }

  mockUsers.push(newUser)

  const userData = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  }

  const response = {
    user: userData,
    token: 'mock-auth-token-' + Date.now(),
  }

  // Store the user data
  await AsyncStorage.setItem('user', JSON.stringify(userData))
  await AsyncStorage.setItem('userToken', response.token)

  return response
}

export const forgotPassword = async (email: string) => {
  console.log('Mock forgot password for:', email)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  const user = mockUsers.find((u) => u.email === email)

  if (!user) {
    throw new Error('User not found')
  }

  return { success: true, message: 'Password reset link sent' }
}

export const resetPassword = async (token: string, password: string) => {
  console.log('Mock reset password with token:', token)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  return { success: true, message: 'Password reset successfully' }
}

export const verifyEmail = async (email: string, otpCode: string) => {
  console.log('Mock verify email:', email, otpCode)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return { success: true, message: 'Email verified successfully' }
}

export const verifyResetCode = async (email: string, otpCode: string) => {
  console.log('Mock verify reset code:', email, otpCode)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return { success: true, message: 'Code verified successfully' }
}

export const resendVerificationCode = async (email: string) => {
  console.log('Mock resend verification code to:', email)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return { success: true, message: 'Verification code resent' }
}

// Mock Quran data
export const getAllSurahs = async () => {
  console.log('Mock getting all surahs')

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Return some basic surah data
  return [
    {
      number: 1,
      name: 'الفاتحة',
      englishName: 'Al-Fatiha',
      englishNameTranslation: 'The Opening',
      numberOfAyahs: 7,
      revelationType: 'Meccan',
      ayahs: [], // Add this empty array to satisfy the type requirement
    },
    {
      number: 2,
      name: 'البقرة',
      englishName: 'Al-Baqarah',
      englishNameTranslation: 'The Cow',
      numberOfAyahs: 286,
      revelationType: 'Medinan',
      ayahs: [], // Add this empty array to satisfy the type requirement
    },
    {
      number: 3,
      name: 'آل عمران',
      englishName: 'Aal-Imran',
      englishNameTranslation: 'The Family of Imran',
      numberOfAyahs: 200,
      revelationType: 'Medinan',
      ayahs: [], // Add this empty array to satisfy the type requirement
    },
    // More surahs would be here in a real implementation
  ]
}

// Mock recitation stats
export const getRecitationStats = async () => {
  console.log('Mock getting recitation stats')

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  return {
    totalAyahsMemorized: 35,
    totalAyahsInQuran: 6236,
    averageScore: 85,
    memorizedSurahs: [
      {
        surahId: 1,
        surahName: 'Al-Fatiha',
        completionPercentage: 100,
        lastReview: new Date().toISOString(),
        ayahsMemorized: 7,
        totalAyahs: 7,
      },
      {
        surahId: 114,
        surahName: 'An-Nas',
        completionPercentage: 100,
        lastReview: new Date().toISOString(),
        ayahsMemorized: 6,
        totalAyahs: 6,
      },
    ],
    recentActivity: [
      {
        date: new Date().toISOString(),
        ayahsReviewed: 12,
        averageScore: 85,
      },
    ],
  }
}

// Mock recitation history
export const getRecitationHistory = async (page = 1, limit = 10) => {
  console.log('Mock getting recitation history page:', page)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const mockHistory = Array.from({ length: 20 }, (_, i) => ({
    id: `hist${i + 1}`,
    surahId: (i % 10) + 1,
    surahName: `Surah ${(i % 10) + 1}`,
    ayahId: (i % 5) + 1,
    ayahNumber: (i % 5) + 1,
    score: 70 + (i % 30),
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    duration: 20 + (i % 40),
  }))

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const pageData = mockHistory.slice(startIndex, endIndex)

  return {
    data: pageData,
    hasMore: endIndex < mockHistory.length,
    totalPages: Math.ceil(mockHistory.length / limit),
    currentPage: page,
  }
}

// Export a default mock API object for convenience
export default {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyResetCode,
  resendVerificationCode,
  getAllSurahs,
  getRecitationStats,
  getRecitationHistory,
}
