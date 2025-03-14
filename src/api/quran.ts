import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import { Surah, Ayah } from '../models/Surah'

// Base URL for the Quran API
const API_URL = 'https://api.quran.com/api/v4'

// Create an axios instance for the API
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // 20 seconds timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Local cache directory for Quran data
const quranCacheDir = `${FileSystem.documentDirectory}quran_cache/`

// Constants for cache keys
const CACHE_KEYS = {
  ALL_SURAHS: 'quran_all_surahs',
  SURAH_PREFIX: 'quran_surah_',
}

// Cache duration in milliseconds (7 days)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000

// Helper function to create an Ayah object with all required properties
const createAyah = (data: any): Ayah => {
  return {
    number: data.id || data.number || 0,
    numberInSurah: data.verse_number || data.numberInSurah || 0,
    juz: data.juz_number || data.juz || 1,
    manzil: data.manzil || 1,
    ruku: data.ruku || 1,
    hizbQuarter: data.hizb_quarter || data.hizbQuarter || 1,
    sajda: data.sajda || false,
    text: data.text_uthmani || data.text_indopak || data.text || '',
    translation: data.translation || '',
  }
}

// Function to map JSON data to our Surah model
const mapJsonToSurah = (jsonSurah: any): Surah => {
  return {
    number: jsonSurah.number || jsonSurah.id || 0,
    name:
      jsonSurah.name || jsonSurah.arabic_name || jsonSurah.name_arabic || '',
    englishName:
      jsonSurah.english_name ||
      jsonSurah.englishName ||
      jsonSurah.name_simple ||
      '',
    englishNameTranslation:
      jsonSurah.english_translation ||
      jsonSurah.englishNameTranslation ||
      (jsonSurah.translated_name && jsonSurah.translated_name.name) ||
      '',
    numberOfAyahs:
      jsonSurah.ayah_count ||
      jsonSurah.verses_count ||
      jsonSurah.numberOfAyahs ||
      0,
    revelationType:
      jsonSurah.revelation_type ||
      jsonSurah.revelationType ||
      jsonSurah.revelation_place ||
      'Unknown',
    ayahs: Array.isArray(jsonSurah.ayahs)
      ? jsonSurah.ayahs.map((jsonAyah: any) => createAyah(jsonAyah))
      : [],
  }
}

// Ensure the cache directory exists
const ensureCacheDirectory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(quranCacheDir)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(quranCacheDir, {
        intermediates: true,
      })
      console.log('Created Quran cache directory')
    }
  } catch (error) {
    console.error('Error creating cache directory:', error)
  }
}

// Function to get cached data if valid
const getCachedData = async (key: string): Promise<any | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(key)
    if (cachedData) {
      const parsedData = JSON.parse(cachedData)
      // Check if cache is still valid (not expired)
      if (
        parsedData.timestamp &&
        Date.now() - parsedData.timestamp < CACHE_DURATION
      ) {
        console.log(`Using cached data for ${key}`)
        return parsedData.data
      }
      console.log(`Cache expired for ${key}`)
    }
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error)
  }
  return null
}

// Function to cache data with timestamp
const cacheData = async (key: string, data: any): Promise<void> => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    }
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry))
    console.log(`Data cached for ${key}`)
  } catch (error) {
    console.error(`Error caching data for ${key}:`, error)
  }
}

// Generate placeholder surahs as a last resort
const generatePlaceholderSurahs = (): Surah[] => {
  console.log('Generating placeholder surahs')
  const placeholders: Surah[] = []

  // Names of some well-known surahs for more realistic placeholders
  const popularSurahs = [
    {
      number: 1,
      name: 'الفاتحة',
      englishName: 'Al-Fatiha',
      englishNameTranslation: 'The Opening',
      ayahCount: 7,
    },
    {
      number: 2,
      name: 'البقرة',
      englishName: 'Al-Baqarah',
      englishNameTranslation: 'The Cow',
      ayahCount: 286,
    },
    {
      number: 3,
      name: 'آل عمران',
      englishName: 'Aal-Imran',
      englishNameTranslation: 'The Family of Imran',
      ayahCount: 200,
    },
    {
      number: 36,
      name: 'يس',
      englishName: 'Ya-Sin',
      englishNameTranslation: 'Ya Sin',
      ayahCount: 83,
    },
    {
      number: 114,
      name: 'الناس',
      englishName: 'An-Nas',
      englishNameTranslation: 'The Mankind',
      ayahCount: 6,
    },
  ]

  // Add the popular surahs first
  popularSurahs.forEach((surah) => {
    // Generate placeholder ayahs for each surah
    const ayahs: Ayah[] = []
    for (let i = 1; i <= surah.ayahCount; i++) {
      ayahs.push({
        number: surah.number * 1000 + i,
        numberInSurah: i,
        juz: 1,
        manzil: 1,
        ruku: 1,
        hizbQuarter: 1,
        sajda: false,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: `Placeholder verse ${i} of Surah ${surah.englishName}`,
      })
    }

    placeholders.push({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.ayahCount,
      revelationType: surah.number <= 86 ? 'Meccan' : 'Medinan',
      ayahs: ayahs,
    })
  })

  // Then fill in the rest to make 114 surahs
  for (let i = 1; i <= 114; i++) {
    if (!placeholders.some((s) => s.number === i)) {
      // Generate placeholder ayahs
      const ayahs: Ayah[] = []
      for (let j = 1; j <= 10; j++) {
        ayahs.push({
          number: i * 1000 + j,
          numberInSurah: j,
          juz: 1,
          manzil: 1,
          ruku: 1,
          hizbQuarter: 1,
          sajda: false,
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translation: `Placeholder verse ${j} of Surah ${i}`,
        })
      }

      placeholders.push({
        number: i,
        name: `سورة ${i}`,
        englishName: `Surah ${i}`,
        englishNameTranslation: 'Placeholder',
        numberOfAyahs: 10, // Default placeholder value
        revelationType: i <= 86 ? 'Meccan' : 'Medinan', // Approximate division
        ayahs: ayahs,
      })
    }
  }

  // Sort by surah number
  placeholders.sort((a, b) => a.number - b.number)

  return placeholders
}

// Get all surahs with basic information
export const getAllSurahs = async (): Promise<Surah[]> => {
  try {
    await ensureCacheDirectory()

    // Check cache first
    const cachedSurahs = await getCachedData(CACHE_KEYS.ALL_SURAHS)
    if (cachedSurahs) {
      return cachedSurahs
    }

    // Try fetching from network
    console.log('Fetching surahs from network')
    try {
      const response = await api.get('/chapters')

      if (response && response.data) {
        // Parse the response based on expected structure
        let surahs = []

        if (Array.isArray(response.data)) {
          surahs = response.data
        } else if (response.data.chapters) {
          surahs = response.data.chapters
        } else if (response.data.data) {
          surahs = response.data.data
        }

        if (Array.isArray(surahs) && surahs.length > 0) {
          // Map API response to our Surah model
          const mappedSurahs = surahs.map(mapJsonToSurah)

          // Cache the data for future use
          await cacheData(CACHE_KEYS.ALL_SURAHS, mappedSurahs)

          console.log(
            `Successfully fetched ${mappedSurahs.length} surahs from API`,
          )
          return mappedSurahs
        }
      }
    } catch (networkError) {
      console.error('API error fetching surahs:', networkError)
    }

    // If network fails, generate placeholders as last resort
    console.log('Network failed, generating placeholders')
    const placeholderSurahs = generatePlaceholderSurahs()
    return placeholderSurahs
  } catch (error) {
    console.error('Error in getAllSurahs:', error)
    // Return placeholder data as a fallback
    return generatePlaceholderSurahs()
  }
}

// Get a specific surah with all ayahs
export const getSurah = async (surahNumber: number): Promise<Surah> => {
  try {
    await ensureCacheDirectory()

    // Check cache
    const cacheKey = `${CACHE_KEYS.SURAH_PREFIX}${surahNumber}`
    const cachedSurah = await getCachedData(cacheKey)
    if (cachedSurah) {
      return cachedSurah
    }

    // Try fetching from network
    console.log(`Fetching surah ${surahNumber} from network`)
    try {
      // Get surah info
      const surahResponse = await api.get(`/chapters/${surahNumber}`)

      // Get verses separately
      const versesResponse = await api.get(`/verses/by_chapter/${surahNumber}`)

      if (surahResponse.data && versesResponse.data) {
        const surahData = surahResponse.data.chapter || surahResponse.data
        const versesData = versesResponse.data.verses || versesResponse.data

        const ayahs: Ayah[] = Array.isArray(versesData)
          ? versesData.map(createAyah)
          : []

        // Map to our Surah model
        const surah: Surah = mapJsonToSurah({
          ...surahData,
          ayahs: ayahs,
        })

        // Cache the surah data
        await cacheData(cacheKey, surah)

        console.log(
          `Successfully fetched surah ${surahNumber} with ${ayahs.length} ayahs`,
        )
        return surah
      }
    } catch (networkError) {
      console.error(`API error fetching surah ${surahNumber}:`, networkError)
    }

    // If network fails, create a placeholder
    const placeholderSurahs = generatePlaceholderSurahs()
    const placeholderSurah = placeholderSurahs.find(
      (s) => s.number === surahNumber,
    )
    if (placeholderSurah) {
      return placeholderSurah
    }

    // If no matching placeholder, create a basic one
    const defaultAyahs: Ayah[] = []
    for (let i = 1; i <= 10; i++) {
      defaultAyahs.push({
        number: surahNumber * 1000 + i,
        numberInSurah: i,
        juz: 1,
        manzil: 1,
        ruku: 1,
        hizbQuarter: 1,
        sajda: false,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: `Placeholder verse ${i} of Surah ${surahNumber}`,
      })
    }

    return {
      number: surahNumber,
      name: `سورة ${surahNumber}`,
      englishName: `Surah ${surahNumber}`,
      englishNameTranslation: 'Placeholder',
      numberOfAyahs: 10,
      revelationType: surahNumber <= 86 ? 'Meccan' : 'Medinan',
      ayahs: defaultAyahs,
    }
  } catch (error) {
    console.error(`Error in getSurah(${surahNumber}):`, error)

    // Return a placeholder surah
    const defaultAyahs: Ayah[] = []
    for (let i = 1; i <= 10; i++) {
      defaultAyahs.push({
        number: surahNumber * 1000 + i,
        numberInSurah: i,
        juz: 1,
        manzil: 1,
        ruku: 1,
        hizbQuarter: 1,
        sajda: false,
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: `Placeholder verse ${i} of Surah ${surahNumber}`,
      })
    }

    return {
      number: surahNumber,
      name: `سورة ${surahNumber}`,
      englishName: `Surah ${surahNumber}`,
      englishNameTranslation: 'Placeholder',
      numberOfAyahs: 10,
      revelationType: surahNumber <= 86 ? 'Meccan' : 'Medinan',
      ayahs: defaultAyahs,
    }
  }
}

// Get a specific ayah
export const getAyah = async (
  surahNumber: number,
  ayahNumber: number,
): Promise<Ayah> => {
  try {
    // Try to get the surah first
    const surah = await getSurah(surahNumber)

    // Look for the ayah in the surah
    const foundAyah = surah.ayahs.find((a) => a.numberInSurah === ayahNumber)

    // If ayah found, return it
    if (foundAyah) {
      return foundAyah
    }

    // Try to fetch it directly from the API
    try {
      const response = await api.get(`/verses/${surahNumber}/${ayahNumber}`)

      if (response.data) {
        const ayahData = response.data.verse || response.data
        return createAyah(ayahData)
      }
    } catch (ayahError) {
      console.error(
        `Error fetching ayah ${surahNumber}:${ayahNumber}:`,
        ayahError,
      )
    }

    // If ayah still not found, create a placeholder
    return {
      number: surahNumber * 1000 + ayahNumber,
      numberInSurah: ayahNumber,
      juz: 1,
      manzil: 1,
      ruku: 1,
      hizbQuarter: 1,
      sajda: false,
      text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'Placeholder verse',
    }
  } catch (error) {
    console.error(`Error in getAyah(${surahNumber}, ${ayahNumber}):`, error)

    // Return a placeholder ayah
    return {
      number: surahNumber * 1000 + ayahNumber,
      numberInSurah: ayahNumber,
      juz: 1,
      manzil: 1,
      ruku: 1,
      hizbQuarter: 1,
      sajda: false,
      text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'Placeholder verse',
    }
  }
}

// Search the Quran
export const searchQuran = async (query: string): Promise<Ayah[]> => {
  try {
    console.log(`Searching Quran for: "${query}"`)

    try {
      const response = await api.get('/search', { params: { q: query } })

      if (response.data) {
        const results =
          response.data.results || response.data.verses || response.data

        if (Array.isArray(results) && results.length > 0) {
          return results.map((result) => createAyah(result))
        }
      }
    } catch (searchError) {
      console.error('API search error:', searchError)
    }

    // If API search fails, return an empty array
    return []
  } catch (error) {
    console.error('Error in searchQuran:', error)
    return []
  }
}

export default api
