// src/services/mockStorage.ts
import { Surah, Ayah } from '../models/Surah'

// Mock data for testing
const mockSurahs = [
  {
    number: 1,
    name: 'الفاتحة',
    englishName: 'Al-Fatiha',
    englishNameTranslation: 'The Opening',
    numberOfAyahs: 7,
    revelationType: 'Meccan',
    ayahs: [
      {
        number: 1,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        numberInSurah: 1,
        juz: 1,
        manzil: 1,
        ruku: 1,
        hizbQuarter: 1,
        sajda: false,
        translation:
          'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      },
      // Additional ayahs would be here
    ],
  },
  {
    number: 2,
    name: 'البقرة',
    englishName: 'Al-Baqarah',
    englishNameTranslation: 'The Cow',
    numberOfAyahs: 286,
    revelationType: 'Medinan',
    ayahs: [
      // Ayahs would be here
    ],
  },
  // Additional surahs would be here
]

// Mock recitation history
const mockRecitationHistory = [
  {
    id: '1',
    ayahId: 1,
    surahId: 1,
    surahName: 'Al-Fatiha',
    ayahNumber: 1,
    date: new Date().toISOString(),
    score: 95,
    duration: 30,
    recordingUri: 'mock-uri',
  },
  {
    id: '2',
    ayahId: 2,
    surahId: 1,
    surahName: 'Al-Fatiha',
    ayahNumber: 2,
    date: new Date().toISOString(),
    score: 85,
    duration: 25,
    recordingUri: 'mock-uri',
  },
]

// Initialize mock database
export const initializeDatabase = async (): Promise<void> => {
  console.log('Mock database initialized successfully')
  return Promise.resolve()
}

// Mock query execution
export const executeQuery = async (
  query: string,
  params: any[] = [],
): Promise<any> => {
  console.log('Mock query executed:', query, params)
  return Promise.resolve({
    rows: {
      length: 0,
      item: (idx: number) => ({}),
      _array: [],
    },
    insertId: 0,
    rowsAffected: 0,
  })
}

// Mock user progress
export const getUserProgress = async (userId: string): Promise<any> => {
  return {
    totalAyahsMemorized: 15,
    totalAyahsStarted: 30,
    surahsStarted: 2,
    averageScore: 85,
    memorizedSurahs: [
      {
        surahId: 1,
        surahName: 'Al-Fatiha',
        completionPercentage: 100,
        lastReview: new Date().toISOString(),
        totalAyahs: 7,
        memorizedAyahs: 7,
      },
      {
        surahId: 2,
        surahName: 'Al-Baqarah',
        completionPercentage: 15,
        lastReview: new Date().toISOString(),
        totalAyahs: 286,
        memorizedAyahs: 43,
      },
    ],
    recentActivity: [
      {
        date: new Date().toISOString(),
        ayahsReviewed: 10,
        averageScore: 88,
      },
    ],
  }
}

// Mock recitation progress
export const saveRecitationProgress = async (
  userId: string,
  surahId: number,
  ayahId: number,
  score: number,
  duration: number,
  recordingPath?: string,
  notes?: string,
): Promise<void> => {
  console.log('Mock saving recitation progress:', {
    userId,
    surahId,
    ayahId,
    score,
  })
  return Promise.resolve()
}

// Mock get all surahs
export const getAllSurahs = async (): Promise<any[]> => {
  console.log('Mock getting all surahs')
  return Promise.resolve(mockSurahs)
}

// Mock get surah
export const getSurah = async (surahNumber: number): Promise<any> => {
  const surah = mockSurahs.find((s) => s.number === surahNumber)
  if (!surah) {
    throw new Error(`Surah ${surahNumber} not found`)
  }
  return Promise.resolve(surah)
}

// Mock user settings
export const saveUserSettings = async (
  userId: string,
  settings: Record<string, any>,
): Promise<void> => {
  console.log('Mock saving user settings:', settings)
  return Promise.resolve()
}

// Mock get user settings
export const getUserSettings = async (
  userId: string,
): Promise<Record<string, any>> => {
  return Promise.resolve({
    showTranslation: true,
    showTransliteration: false,
    arabicFontSize: 24,
    preferredReciter: 'Mishary Rashid Alafasy',
    autoPlayRecitation: true,
    dailyReminderTime: '18:00',
    notificationsEnabled: true,
  })
}

// Mock clear database
export const clearDatabase = async (): Promise<void> => {
  console.log('Mock database cleared')
  return Promise.resolve()
}
