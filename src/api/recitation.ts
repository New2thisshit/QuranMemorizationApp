// src/api/recitation.ts
import api from './auth'
import * as mockApi from './mockApi'

// Flag to use mock API instead of real API
const USE_MOCK_API = true

// Types for recitation progress
type RecitationProgress = {
  ayahId: string
  score: number
  timestamp: string
  recordingUri?: string
}

type RecitationStats = {
  totalAyahsMemorized: number
  averageScore: number
  memorizedSurahs: {
    surahId: number
    surahName: string
    completionPercentage: number
    lastReview: string
  }[]
  recentActivity: {
    date: string
    ayahsReviewed: number
    averageScore: number
  }[]
}

// Save recitation progress for a specific ayah
export const saveProgress = async (progress: RecitationProgress) => {
  try {
    if (USE_MOCK_API) {
      // Mock implementation - just log and return success
      console.log('Mock saving recitation progress:', progress)
      return { success: true }
    }

    const response = await api.post('/recitations/progress', progress)
    return response.data
  } catch (error) {
    console.error('Save recitation progress API error:', error)
    throw error
  }
}

// Get user's recitation statistics
export const getRecitationStats = async (): Promise<RecitationStats> => {
  try {
    if (USE_MOCK_API) {
      return await mockApi.getRecitationStats()
    }

    const response = await api.get('/recitations/stats')
    return response.data
  } catch (error) {
    console.error('Get recitation stats API error:', error)
    // Return mock data as fallback
    return {
      totalAyahsMemorized: 0,
      averageScore: 0,
      memorizedSurahs: [],
      recentActivity: [],
    }
  }
}

// Get user's progress for a specific surah
export const getSurahProgress = async (surahId: number) => {
  try {
    if (USE_MOCK_API) {
      // Basic mock implementation
      return {
        surahId,
        completionPercentage: 50,
        ayahsProgress: Array.from({ length: 10 }, (_, i) => ({
          ayahNumber: i + 1,
          ayahId: i + 1,
          status: i < 5 ? 'memorized' : 'learning',
          lastScore: 80 + (i % 20),
          reviewCount: 5 - (i % 5),
          dateMemorized: i < 5 ? new Date().toISOString() : null,
          lastReviewDate: new Date().toISOString(),
        })),
      }
    }

    const response = await api.get(`/recitations/progress/surah/${surahId}`)
    return response.data
  } catch (error) {
    console.error(`Get surah ${surahId} progress API error:`, error)
    throw error
  }
}

// Analyze audio and get feedback (this might be a more complex API endpoint)
export const analyzeRecitation = async (
  recordingUri: string,
  ayahId: string,
) => {
  try {
    if (USE_MOCK_API) {
      // Mock implementation for recitation analysis
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate processing time

      return {
        transcription: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        confidence: 0.85,
        correctWords: ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'],
        incorrectWords: [],
        missedWords: [],
        accuracy: 95,
      }
    }

    // Create FormData to upload the audio file
    const formData = new FormData()

    // Append the audio file
    formData.append('audio', ({
      uri: recordingUri,
      type: 'audio/m4a', // or the appropriate MIME type
      name: 'recitation.m4a',
    } as unknown) as Blob)

    // Append the ayah ID
    formData.append('ayahId', ayahId)

    // Make the API request
    const response = await api.post('/recitations/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  } catch (error) {
    console.error('Analyze recitation API error:', error)
    throw error
  }
}

// Get recitation history
export const getRecitationHistory = async (page = 1, limit = 20) => {
  try {
    if (USE_MOCK_API) {
      return await mockApi.getRecitationHistory(page, limit)
    }

    const response = await api.get('/recitations/history', {
      params: { page, limit },
    })
    return response.data
  } catch (error) {
    console.error('Get recitation history API error:', error)
    throw error
  }
}
