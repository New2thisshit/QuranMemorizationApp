import api from './auth'

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
    const response = await api.get('/recitations/stats')
    return response.data
  } catch (error) {
    console.error('Get recitation stats API error:', error)
    throw error
  }
}

// Get user's progress for a specific surah
export const getSurahProgress = async (surahId: number) => {
  try {
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
    const response = await api.get('/recitations/history', {
      params: { page, limit },
    })
    return response.data
  } catch (error) {
    console.error('Get recitation history API error:', error)
    throw error
  }
}
