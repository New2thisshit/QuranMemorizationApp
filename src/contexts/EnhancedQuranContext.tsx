import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react'
import QuranStorageService from '../services/QuranStorageService'
import {
  EnhancedSurah,
  EnhancedAyah,
  ResourceMetadata,
  ContentStatus,
  DataSource,
  ResourceType,
  DataPreferences,
} from '../models/QuranDataTypes'
import * as Network from '@react-native-community/netinfo'
import { Alert } from 'react-native'
import type {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo'

// Create a singleton instance of the QuranStorageService
const quranStorageService = new QuranStorageService()

// Define the context type
type EnhancedQuranContextType = {
  // Surah and Ayah data
  surahs: EnhancedSurah[]
  currentSurah: EnhancedSurah | null
  currentAyah: EnhancedAyah | null

  // Loading and error states
  isLoading: boolean
  error: string | null
  isOnline: boolean

  // Resource management
  availableResources: ResourceMetadata[]
  downloadProgress: Map<string, number> // resourceId -> progress (0-100)

  // Data preferences
  dataPreferences: DataPreferences

  // Operations for surahs and ayahs
  fetchSurahs: () => Promise<void>
  setSurah: (surahNumber: number) => Promise<void>
  setAyah: (ayahNumber: number) => void
  getNextAyah: () => EnhancedAyah | null
  getPreviousAyah: () => EnhancedAyah | null

  // Operations for resources
  downloadResource: (resourceId: string) => Promise<boolean>
  deleteResource: (resourceId: string) => Promise<boolean>
  getResourceProgress: (resourceId: string) => number
  isResourceAvailable: (resourceId: string) => Promise<boolean>

  // Storage management
  getStorageUsage: () => Promise<number>
  clearAllData: () => Promise<boolean>
  updateDataPreferences: (prefs: Partial<DataPreferences>) => void
}

// Default preferences
const DEFAULT_PREFERENCES: DataPreferences = {
  autoDownloadFavorites: false,
  preferredTranslation: 'en-sahih-international',
  preferredRecitation: 'ar-mishary-rashid-alafasy',
  preferredTafsir: 'en-tafsir-ibn-kathir',
  downloadOnWifiOnly: true,
  maxStorageUsage: 500, // 500 MB
}

// Create the context with a default value
const EnhancedQuranContext = createContext<
  EnhancedQuranContextType | undefined
>(undefined)

// Provider component
export const EnhancedQuranProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Surah and ayah state
  const [surahs, setSurahs] = useState<EnhancedSurah[]>([])
  const [currentSurah, setCurrentSurah] = useState<EnhancedSurah | null>(null)
  const [currentAyah, setCurrentAyah] = useState<EnhancedAyah | null>(null)

  // Status states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  // Resource management states
  const [availableResources, setAvailableResources] = useState<
    ResourceMetadata[]
  >([])
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(
    new Map(),
  )

  // User preferences
  const [dataPreferences, setDataPreferences] = useState<DataPreferences>(
    DEFAULT_PREFERENCES,
  )

  // Initialize network status monitoring
  useEffect(() => {
    // Check initial network state
    Network.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected === true)
    })

    // Subscribe to network status changes
    const unsubscribe: NetInfoSubscription = Network.addEventListener(
      (state: NetInfoState) => {
        setIsOnline(state.isConnected === true)
      },
    )

    // Cleanup subscription
    return () => {
      unsubscribe()
    }
  }, [])

  // Initialize the storage service and load initial data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Initialize the storage service
        await quranStorageService.initialize()

        // Load available resources
        const resources = await quranStorageService.getAvailableResources()
        setAvailableResources(resources)

        // Load all surahs metadata (without all ayahs for efficiency)
        const allSurahs = await quranStorageService.getAllSurahs()
        setSurahs(allSurahs)

        // Load user preferences (this would come from AsyncStorage in a real app)
        // For simplicity, we're just using the defaults
      } catch (err) {
        setError('Failed to initialize Quran data: ' + String(err))
        console.error('Initialization error:', err)

        Alert.alert(
          'Initialization Error',
          'There was a problem loading the Quran data. Some features may not work correctly.',
          [{ text: 'OK' }],
        )
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  // Fetch all surahs (metadata only, for efficiency)
  const fetchSurahs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const allSurahs = await quranStorageService.getAllSurahs()
      setSurahs(allSurahs)
    } catch (err) {
      setError('Failed to fetch Quran data: ' + String(err))
      console.error('Error fetching surahs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Set the current surah and load its full data
  const setSurah = async (surahNumber: number) => {
    setIsLoading(true)
    setError(null)

    try {
      // Load the full surah data (including all ayahs)
      const surah = await quranStorageService.getSurah(surahNumber)
      setCurrentSurah(surah)

      // Set the first ayah as current by default
      if (surah.ayahs && surah.ayahs.length > 0) {
        setCurrentAyah(surah.ayahs[0])
      } else {
        setCurrentAyah(null)
      }
    } catch (err) {
      setError(`Failed to load Surah ${surahNumber}: ` + String(err))
      console.error(`Error setting surah ${surahNumber}:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  // Set the current ayah within the current surah
  const setAyah = (ayahNumber: number) => {
    if (!currentSurah || !currentSurah.ayahs) {
      setError('No surah selected')
      return
    }

    const ayah = currentSurah.ayahs.find((a) => a.numberInSurah === ayahNumber)
    if (ayah) {
      setCurrentAyah(ayah)
    } else {
      setError(`Ayah ${ayahNumber} not found in current surah`)
    }
  }

  // Get the next ayah in the current surah
  const getNextAyah = (): EnhancedAyah | null => {
    if (!currentSurah || !currentAyah) return null

    const currentIndex = currentSurah.ayahs.findIndex(
      (a) => a.numberInSurah === currentAyah.numberInSurah,
    )

    if (currentIndex < currentSurah.ayahs.length - 1) {
      return currentSurah.ayahs[currentIndex + 1]
    }

    // If we're at the end of the surah, return null
    return null
  }

  // Get the previous ayah in the current surah
  const getPreviousAyah = (): EnhancedAyah | null => {
    if (!currentSurah || !currentAyah) return null

    const currentIndex = currentSurah.ayahs.findIndex(
      (a) => a.numberInSurah === currentAyah.numberInSurah,
    )

    if (currentIndex > 0) {
      return currentSurah.ayahs[currentIndex - 1]
    }

    // If we're at the beginning of the surah, return null
    return null
  }

  // Download a resource for offline use
  const downloadResource = async (resourceId: string): Promise<boolean> => {
    try {
      // Check if we can download based on preferences
      if (dataPreferences.downloadOnWifiOnly) {
        const networkState = await Network.fetch()
        if (!networkState.isConnected || networkState.type !== 'wifi') {
          Alert.alert(
            'WiFi Required',
            'Your settings require WiFi for downloads. Please connect to WiFi and try again.',
            [{ text: 'OK' }],
          )
          return false
        }
      }

      // Initialize progress tracking
      setDownloadProgress((prev) => {
        const newMap = new Map(prev)
        newMap.set(resourceId, 0)
        return newMap
      })

      // Start the download
      const result = await quranStorageService.downloadResource(resourceId)

      // Update available resources list after download
      const resources = await quranStorageService.getAvailableResources()
      setAvailableResources(resources)

      // Clean up progress tracking
      setDownloadProgress((prev) => {
        const newMap = new Map(prev)
        newMap.delete(resourceId)
        return newMap
      })

      return result
    } catch (error) {
      console.error(`Error downloading resource ${resourceId}:`, error)

      // Clean up progress tracking on error
      setDownloadProgress((prev) => {
        const newMap = new Map(prev)
        newMap.delete(resourceId)
        return newMap
      })

      return false
    }
  }

  // Delete a resource to free up space
  const deleteResource = async (resourceId: string): Promise<boolean> => {
    try {
      const result = await quranStorageService.deleteResource(resourceId)

      // Update available resources list after deletion
      const resources = await quranStorageService.getAvailableResources()
      setAvailableResources(resources)

      return result
    } catch (error) {
      console.error(`Error deleting resource ${resourceId}:`, error)
      return false
    }
  }

  // Get the download progress for a resource
  const getResourceProgress = (resourceId: string): number => {
    return downloadProgress.get(resourceId) || 0
  }

  // Check if a resource is available locally
  const isResourceAvailable = (resourceId: string): Promise<boolean> => {
    return quranStorageService.isResourceAvailable(resourceId)
  }

  // Get total storage used by the app
  const getStorageUsage = (): Promise<number> => {
    return quranStorageService.getTotalStorageUsed()
  }

  // Clear all downloaded and cached data
  const clearAllData = async (): Promise<boolean> => {
    try {
      const result = await quranStorageService.clearAllData()

      // Reload everything
      const resources = await quranStorageService.getAvailableResources()
      setAvailableResources(resources)

      const allSurahs = await quranStorageService.getAllSurahs()
      setSurahs(allSurahs)

      // Reset current selections
      setCurrentSurah(null)
      setCurrentAyah(null)

      return result
    } catch (error) {
      console.error('Error clearing all data:', error)
      return false
    }
  }

  // Update user preferences for data management
  const updateDataPreferences = (prefs: Partial<DataPreferences>) => {
    setDataPreferences((prev) => ({
      ...prev,
      ...prefs,
    }))

    // In a real app, you would also save this to AsyncStorage
  }

  // Prepare the context value
  const contextValue: EnhancedQuranContextType = {
    surahs,
    currentSurah,
    currentAyah,
    isLoading,
    error,
    isOnline,
    availableResources,
    downloadProgress,
    dataPreferences,
    fetchSurahs,
    setSurah,
    setAyah,
    getNextAyah,
    getPreviousAyah,
    downloadResource,
    deleteResource,
    getResourceProgress,
    isResourceAvailable,
    getStorageUsage,
    clearAllData,
    updateDataPreferences,
  }

  return (
    <EnhancedQuranContext.Provider value={contextValue}>
      {children}
    </EnhancedQuranContext.Provider>
  )
}

// Custom hook to use the Quran context
export const useEnhancedQuran = () => {
  const context = useContext(EnhancedQuranContext)
  if (context === undefined) {
    throw new Error(
      'useEnhancedQuran must be used within an EnhancedQuranProvider',
    )
  }
  return context
}
