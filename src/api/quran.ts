import api from './auth'
import { Surah, Ayah } from '../models/Surah'
import * as FileSystem from 'expo-file-system'

// Local cache directory for Quran data
const quranCacheDir = `${FileSystem.documentDirectory}quran_cache/`

// Ensure the cache directory exists
const ensureCacheDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(quranCacheDir)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(quranCacheDir, { intermediates: true })
  }
}

// Get all surahs with basic info
export const getAllSurahs = async (): Promise<Surah[]> => {
  try {
    // Check if we have cached data
    await ensureCacheDirectory()
    const cacheFile = `${quranCacheDir}all_surahs.json`
    const fileInfo = await FileSystem.getInfoAsync(cacheFile)

    // Use cached data if available and not expired (e.g., less than 30 days old)
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(cacheFile)
      const cachedData = JSON.parse(fileContent)

      // Check if cache is valid (has timestamp and is less than 30 days old)
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
      if (
        cachedData.timestamp &&
        Date.now() - cachedData.timestamp < thirtyDaysInMs
      ) {
        return cachedData.surahs
      }
    }

    // Fetch from API if cache is invalid or doesn't exist
    const response = await api.get('/quran/surahs')

    // Save to cache with timestamp
    const dataToCache = {
      timestamp: Date.now(),
      surahs: response.data,
    }
    await FileSystem.writeAsStringAsync(cacheFile, JSON.stringify(dataToCache))

    return response.data
  } catch (error) {
    console.error('Get all surahs API error:', error)

    // Try to use cache even if expired in case of network error
    try {
      const cacheFile = `${quranCacheDir}all_surahs.json`
      const fileInfo = await FileSystem.getInfoAsync(cacheFile)

      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(cacheFile)
        const cachedData = JSON.parse(fileContent)
        return cachedData.surahs
      }
    } catch (cacheError) {
      console.error('Cache fallback error:', cacheError)
    }

    throw error
  }
}

// Get a specific surah with all ayahs
export const getSurah = async (surahNumber: number): Promise<Surah> => {
  try {
    // Check if we have cached data
    await ensureCacheDirectory()
    const cacheFile = `${quranCacheDir}surah_${surahNumber}.json`
    const fileInfo = await FileSystem.getInfoAsync(cacheFile)

    // Use cached data if available
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(cacheFile)
      const cachedData = JSON.parse(fileContent)

      // Check if cache is valid (less than 30 days old)
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
      if (
        cachedData.timestamp &&
        Date.now() - cachedData.timestamp < thirtyDaysInMs
      ) {
        return cachedData.surah
      }
    }

    // Fetch from API if cache is invalid or doesn't exist
    const response = await api.get(`/quran/surahs/${surahNumber}`)

    // Save to cache with timestamp
    const dataToCache = {
      timestamp: Date.now(),
      surah: response.data,
    }
    await FileSystem.writeAsStringAsync(cacheFile, JSON.stringify(dataToCache))

    return response.data
  } catch (error) {
    console.error(`Get surah ${surahNumber} API error:`, error)

    // Try to use cache even if expired in case of network error
    try {
      const cacheFile = `${quranCacheDir}surah_${surahNumber}.json`
      const fileInfo = await FileSystem.getInfoAsync(cacheFile)

      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(cacheFile)
        const cachedData = JSON.parse(fileContent)
        return cachedData.surah
      }
    } catch (cacheError) {
      console.error('Cache fallback error:', cacheError)
    }

    throw error
  }
}

// Get a specific ayah
export const getAyah = async (
  surahNumber: number,
  ayahNumber: number,
): Promise<Ayah> => {
  try {
    const surah = await getSurah(surahNumber)
    const ayah = surah.ayahs.find((a) => a.number === ayahNumber)

    if (!ayah) {
      throw new Error(`Ayah ${ayahNumber} not found in surah ${surahNumber}`)
    }

    return ayah
  } catch (error) {
    console.error(`Get ayah ${surahNumber}:${ayahNumber} error:`, error)
    throw error
  }
}

// Search the Quran
export const searchQuran = async (query: string): Promise<Ayah[]> => {
  try {
    const response = await api.get('/quran/search', {
      params: { query },
    })
    return response.data
  } catch (error) {
    console.error('Search Quran API error:', error)
    throw error
  }
}
