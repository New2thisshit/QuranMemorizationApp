// src/services/QuranStorageService.ts
import * as FileSystem from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import * as Network from '@react-native-community/netinfo'
import {
  EnhancedSurah,
  EnhancedAyah,
  ResourceMetadata,
  ContentStatus,
  DataSource,
  ResourceType,
} from '../models/QuranDataTypes'

// Import bundled content
import bundledSurahs from '../../assets/quran-data/bundled-quran.json'
import availableResources from '../../assets/quran-data/available-resources.json'

// Define storage paths and keys
const QURAN_BASE_DIR = `${FileSystem.documentDirectory}quran/`
const SURAHS_DIR = `${QURAN_BASE_DIR}surahs/`
const RESOURCES_DIR = `${QURAN_BASE_DIR}resources/`
const AUDIO_DIR = `${QURAN_BASE_DIR}audio/`
const METADATA_KEY = 'quran_metadata_v1'

// Cache duration settings
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

/**
 * Comprehensive service for managing Quran data storage, retrieval, and caching.
 * Handles both bundled data and network-sourced data with intelligent fallbacks.
 */
class QuranStorageService {
  private initialized: boolean = false
  private availableResources: ResourceMetadata[] = []
  private downloadQueue: string[] = []
  private isDownloading: boolean = false

  /**
   * Initialize storage directories and load metadata
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure all required directories exist
      await this.ensureDirectoriesExist()

      // Load metadata about available resources
      await this.loadResourceMetadata()

      // Pre-cache basic Quran data from bundle if not already cached
      await this.initializeFromBundle()

      this.initialized = true
      console.log('QuranStorageService initialized successfully')
    } catch (error) {
      console.error('Failed to initialize QuranStorageService:', error)
      Alert.alert(
        'Initialization Error',
        'There was a problem preparing the app data. Some features may not work correctly.',
      )
    }
  }

  /**
   * Create all required storage directories
   */
  private async ensureDirectoriesExist(): Promise<void> {
    const directories = [QURAN_BASE_DIR, SURAHS_DIR, RESOURCES_DIR, AUDIO_DIR]

    for (const dir of directories) {
      const dirInfo = await FileSystem.getInfoAsync(dir)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
        console.log(`Created directory: ${dir}`)
      }
    }
  }

  /**
   * Load metadata about available resources
   */
  private async loadResourceMetadata(): Promise<void> {
    try {
      // First try to load from AsyncStorage
      const storedMetadata = await AsyncStorage.getItem(METADATA_KEY)

      if (storedMetadata) {
        const parsedMetadata = JSON.parse(storedMetadata)
        this.availableResources = parsedMetadata.resources || []
        console.log(
          `Loaded ${this.availableResources.length} resources from metadata`,
        )
      } else {
        // Fall back to bundled metadata
        this.availableResources = availableResources.resources.map(
          (resource) => ({
            ...resource,
            type: resource.type as ResourceType,
            status: resource.status as ContentStatus,
          }),
        )
        console.log(
          `Loaded ${this.availableResources.length} resources from bundle`,
        )

        // Save this to AsyncStorage for future use
        await AsyncStorage.setItem(
          METADATA_KEY,
          JSON.stringify({
            resources: this.availableResources,
            lastUpdated: Date.now(),
          }),
        )
      }

      // Check if any resources are already downloaded
      await this.updateResourceStatuses()
    } catch (error) {
      console.error('Error loading resource metadata:', error)
      // Fallback to empty if needed
      this.availableResources = []
    }
  }

  /**
   * Update status flags for all resources
   */
  private async updateResourceStatuses(): Promise<void> {
    for (const resource of this.availableResources) {
      const resourcePath = this.getResourcePath(resource)
      const fileInfo = await FileSystem.getInfoAsync(resourcePath)

      resource.status = fileInfo.exists
        ? ContentStatus.AVAILABLE
        : ContentStatus.NOT_AVAILABLE
    }

    // Save updated statuses
    await AsyncStorage.setItem(
      METADATA_KEY,
      JSON.stringify({
        resources: this.availableResources,
        lastUpdated: Date.now(),
      }),
    )
  }

  /**
   * Get path for a specific resource file
   */
  private getResourcePath(resource: ResourceMetadata): string {
    const { type, id } = resource

    switch (type) {
      case ResourceType.TRANSLATION:
        return `${RESOURCES_DIR}translations_${id}.json`
      case ResourceType.TAFSIR:
        return `${RESOURCES_DIR}tafsir_${id}.json`
      case ResourceType.RECITATION:
        return `${RESOURCES_DIR}recitation_${id}.json` // Metadata only, actual audio files stored separately
      default:
        return `${RESOURCES_DIR}resource_${id}.json`
    }
  }
  private normalizeRevelationType(
    type: string,
  ): 'Meccan' | 'Medinan' | 'Unknown' {
    if (!type) return 'Unknown'
    const normalized = type.toLowerCase()
    if (normalized.includes('meccan')) return 'Meccan'
    if (normalized.includes('medinan')) return 'Medinan'
    return 'Unknown'
  }

  /**
   * Initialize data from bundled content
   */
  private async initializeFromBundle(): Promise<void> {
    try {
      // Check if we need to initialize from bundle (only if no surahs are cached)
      const files = await FileSystem.readDirectoryAsync(SURAHS_DIR)
      const surahFiles = files.filter(
        (file) => file.startsWith('surah_') && file.endsWith('.json'),
      )

      if (surahFiles.length === 0) {
        console.log('No cached surahs found, initializing from bundle')

        // Extract bundled data
        const surahs = bundledSurahs.data || []

        // Save each surah to cache
        for (const surah of surahs) {
          const enhancedSurah: EnhancedSurah = {
            ...surah,
            revelationType: this.normalizeRevelationType(surah.revelationType),
            source: DataSource.BUNDLED,
            ayahs: surah.ayahs.map((ayah) => ({
              ...ayah,
              source: DataSource.BUNDLED,
            })),
          }

          await this.saveSurahToCache(enhancedSurah)
        }

        console.log(`Initialized ${surahs.length} surahs from bundle`)
      } else {
        console.log(
          `Found ${surahFiles.length} cached surahs, skipping bundle initialization`,
        )
      }
    } catch (error) {
      console.error('Error initializing from bundle:', error)
      // Continue despite error, we'll use fallbacks
    }
  }

  /**
   * Save a surah to the cache
   */
  private async saveSurahToCache(surah: EnhancedSurah): Promise<void> {
    try {
      const filePath = `${SURAHS_DIR}surah_${surah.number}.json`
      const surahData = {
        ...surah,
        cachedAt: Date.now(),
      }

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(surahData))
    } catch (error) {
      console.error(`Error saving surah ${surah.number} to cache:`, error)
      throw error
    }
  }

  /**
   * Get a surah by number - tries cache first, then network, then falls back to bundle/placeholder
   */
  async getSurah(surahNumber: number): Promise<EnhancedSurah> {
    await this.initialize()

    if (surahNumber < 1 || surahNumber > 114) {
      throw new Error(`Invalid surah number: ${surahNumber}`)
    }

    try {
      // First try to get from cache
      const cachedSurah = await this.getSurahFromCache(surahNumber)
      if (cachedSurah) {
        // Check if cache is fresh enough (30 days)
        const cachedAt = cachedSurah.cachedAt || 0
        const isCacheFresh = Date.now() - cachedAt < CACHE_EXPIRY

        if (isCacheFresh) {
          return cachedSurah
        }
        // If cache is stale but exists, use it but try to refresh in background
        this.refreshSurahInBackground(surahNumber)
        return cachedSurah
      }

      // If not in cache, try to get from network
      const networkSurah = await this.getSurahFromNetwork(surahNumber)
      if (networkSurah) {
        // Save to cache for future use
        await this.saveSurahToCache(networkSurah)
        return networkSurah
      }

      // If network fails, try to get from bundle
      const bundledSurah = this.getSurahFromBundle(surahNumber)
      if (bundledSurah) {
        // Save to cache for future use
        await this.saveSurahToCache(bundledSurah)
        return bundledSurah
      }

      // Last resort: generate a placeholder
      return this.generatePlaceholderSurah(surahNumber)
    } catch (error) {
      console.error(`Error getting surah ${surahNumber}:`, error)
      return this.generatePlaceholderSurah(surahNumber)
    }
  }

  /**
   * Get a surah from local cache
   */
  private async getSurahFromCache(
    surahNumber: number,
  ): Promise<EnhancedSurah | null> {
    try {
      const filePath = `${SURAHS_DIR}surah_${surahNumber}.json`
      const fileInfo = await FileSystem.getInfoAsync(filePath)

      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath)
        const surahData = JSON.parse(fileContent) as EnhancedSurah
        surahData.source = DataSource.CACHED

        console.log(`Loaded surah ${surahNumber} from cache`)
        return surahData
      }

      return null
    } catch (error) {
      console.error(`Error reading surah ${surahNumber} from cache:`, error)
      return null
    }
  }

  /**
   * Get a surah from network API
   */
  private async getSurahFromNetwork(
    surahNumber: number,
  ): Promise<EnhancedSurah | null> {
    try {
      // Check network connectivity first
      const networkState = await Network.fetch()
      if (!networkState.isConnected) {
        console.log('Network not available, skipping API fetch')
        return null
      }

      console.log(`Fetching surah ${surahNumber} from network`)

      // This is where you'd make your API call
      // For now, we'll simulate a network error
      // In your actual implementation, replace this with your API call

      /*
      const response = await fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}?language=en`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to your EnhancedSurah format
      const surah: EnhancedSurah = {
        number: data.chapter.id,
        name: data.chapter.name_arabic,
        englishName: data.chapter.name_simple,
        englishNameTranslation: data.chapter.translated_name.name,
        numberOfAyahs: data.chapter.verses_count,
        revelationType: data.chapter.revelation_place,
        source: DataSource.NETWORK,
        ayahs: [] // You'd need to fetch ayahs separately or in a different endpoint
      };
      
      return surah;
      */

      // Simulating network error for now
      throw new Error('Network fetch simulation failed')
    } catch (error) {
      console.error(`Error fetching surah ${surahNumber} from network:`, error)
      return null
    }
  }

  /**
   * Background refresh of a surah to keep cache fresh
   */
  private async refreshSurahInBackground(surahNumber: number): Promise<void> {
    try {
      const networkSurah = await this.getSurahFromNetwork(surahNumber)
      if (networkSurah) {
        await this.saveSurahToCache(networkSurah)
        console.log(`Updated cache for surah ${surahNumber} in background`)
      }
    } catch (error) {
      console.error(
        `Background refresh failed for surah ${surahNumber}:`,
        error,
      )
      // Non-critical error, so just log it
    }
  }

  /**
   * Get a surah from bundled data
   */
  private getSurahFromBundle(surahNumber: number): EnhancedSurah | null {
    try {
      const bundledData = bundledSurahs.data || []
      const surah = bundledData.find((s) => s.number === surahNumber)

      if (surah) {
        // Transform to EnhancedSurah
        const enhancedSurah: EnhancedSurah = {
          ...surah,
          revelationType: this.normalizeRevelationType(surah.revelationType),

          source: DataSource.BUNDLED,
          ayahs: surah.ayahs.map((ayah) => ({
            ...ayah,
            source: DataSource.BUNDLED,
          })),
        }

        console.log(`Retrieved surah ${surahNumber} from bundle`)
        return enhancedSurah
      }

      return null
    } catch (error) {
      console.error(`Error getting surah ${surahNumber} from bundle:`, error)
      return null
    }
  }

  /**
   * Generate a placeholder surah when all else fails
   */
  private generatePlaceholderSurah(surahNumber: number): EnhancedSurah {
    console.log(`Generating placeholder for surah ${surahNumber}`)

    // Find surah name if possible
    let englishName = `Surah ${surahNumber}`
    let arabicName = `سورة ${surahNumber}`
    let revelationType = 'Unknown'

    // Try to find basic info from bundle if possible
    try {
      const bundledData = bundledSurahs.data || []
      const basicInfo = bundledData.find((s) => s.number === surahNumber)
      if (basicInfo) {
        englishName = basicInfo.englishName || englishName
        arabicName = basicInfo.name || arabicName
        revelationType = basicInfo.revelationType || revelationType
      }
    } catch (error) {
      // Ignore error, use defaults
    }

    return {
      number: surahNumber,
      name: arabicName,
      englishName: englishName,
      englishNameTranslation: englishName,
      numberOfAyahs: 1,
      revelationType: this.normalizeRevelationType(revelationType),
      source: DataSource.GENERATED,
      ayahs: [
        {
          number: 1,
          numberInSurah: 1,
          juz: 1,
          manzil: 1,
          ruku: 1,
          hizbQuarter: 1,
          sajda: false,
          text: 'Content unavailable offline',
          translation: 'Please connect to the internet to download this surah',
          transliteration: '',
          source: DataSource.GENERATED,
        },
      ],
    }
  }

  /**
   * Get all surahs (basic metadata only, not full content)
   */
  async getAllSurahs(): Promise<EnhancedSurah[]> {
    await this.initialize()

    try {
      // Try to get list from cache
      const cacheDir = await FileSystem.readDirectoryAsync(SURAHS_DIR)
      const surahFiles = cacheDir.filter(
        (file) => file.startsWith('surah_') && file.endsWith('.json'),
      )

      if (surahFiles.length > 0) {
        // Load basic metadata from each cached surah, but not full ayahs to save memory
        const surahs: EnhancedSurah[] = []

        for (const file of surahFiles) {
          try {
            const filePath = `${SURAHS_DIR}${file}`
            const content = await FileSystem.readAsStringAsync(filePath)
            const surahData = JSON.parse(content) as EnhancedSurah

            // Include only the metadata, not the full ayahs array to save memory
            surahs.push({
              number: surahData.number,
              name: surahData.name,
              englishName: surahData.englishName,
              englishNameTranslation: surahData.englishNameTranslation,
              numberOfAyahs: surahData.numberOfAyahs,
              revelationType: surahData.revelationType,
              source: DataSource.CACHED,
              ayahs: [], // Omit full ayahs array
            })
          } catch (error) {
            console.error(`Error loading metadata from ${file}:`, error)
            // Continue with other files
          }
        }

        // Sort by surah number
        surahs.sort((a, b) => a.number - b.number)

        if (surahs.length === 114) {
          return surahs
        }

        // If we don't have all 114 surahs, try to fill in gaps from bundle
        return this.completeSurahList(surahs)
      }

      // If cache has no surahs, try network
      const networkSurahs = await this.getAllSurahsFromNetwork()
      if (networkSurahs && networkSurahs.length > 0) {
        return networkSurahs
      }

      // Fall back to bundle
      const bundledSurahs = this.getAllSurahsFromBundle()
      if (bundledSurahs && bundledSurahs.length > 0) {
        return bundledSurahs
      }

      // Last resort: generate a complete list of placeholders
      return this.generatePlaceholderSurahs()
    } catch (error) {
      console.error('Error getting all surahs:', error)
      return this.generatePlaceholderSurahs()
    }
  }

  /**
   * Fill in missing surahs from a partial list
   */
  private completeSurahList(partialList: EnhancedSurah[]): EnhancedSurah[] {
    const complete: EnhancedSurah[] = [...partialList]
    const existingNumbers = new Set(partialList.map((s) => s.number))

    // Find missing surah numbers
    for (let i = 1; i <= 114; i++) {
      if (!existingNumbers.has(i)) {
        // Try to get from bundle
        const bundledSurah = this.getSurahFromBundle(i)
        if (bundledSurah) {
          complete.push({
            ...bundledSurah,
            ayahs: [], // Omit full ayahs to save memory
          })
        } else {
          // Generate placeholder
          const placeholder = this.generatePlaceholderSurah(i)
          complete.push({
            ...placeholder,
            ayahs: [], // Omit full ayahs to save memory
          })
        }
      }
    }

    // Sort by surah number
    return complete.sort((a, b) => a.number - b.number)
  }

  /**
   * Get all surahs from network
   */
  private async getAllSurahsFromNetwork(): Promise<EnhancedSurah[] | null> {
    try {
      // Check network connectivity first
      const networkState = await Network.fetch()
      if (!networkState.isConnected) {
        console.log('Network not available, skipping API fetch for surah list')
        return null
      }

      console.log('Fetching surah list from network')

      // This is where you'd make your API call
      // For now, we'll simulate a network error

      /*
      const response = await fetch('https://api.quran.com/api/v4/chapters?language=en');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to your EnhancedSurah format
      const surahs: EnhancedSurah[] = data.chapters.map(chapter => ({
        number: chapter.id,
        name: chapter.name_arabic,
        englishName: chapter.name_simple,
        englishNameTranslation: chapter.translated_name.name,
        numberOfAyahs: chapter.verses_count,
        revelationType: chapter.revelation_place,
        source: DataSource.NETWORK,
        ayahs: [] // Not including full ayahs in list view
      }));
      
      return surahs;
      */

      // Simulating network error for now
      throw new Error('Network fetch simulation failed')
    } catch (error) {
      console.error('Error fetching surah list from network:', error)
      return null
    }
  }

  /**
   * Get all surahs from bundle
   */
  private getAllSurahsFromBundle(): EnhancedSurah[] | null {
    try {
      const bundledData = bundledSurahs.data || []

      if (bundledData.length > 0) {
        // Transform to EnhancedSurah format
        const surahs = bundledData.map((surah) => ({
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: this.normalizeRevelationType(surah.revelationType),
          source: DataSource.BUNDLED,
          ayahs: [], // Not including full ayahs in list view
        }))

        console.log(`Retrieved ${surahs.length} surahs from bundle`)
        return surahs
      }

      return null
    } catch (error) {
      console.error('Error getting surahs from bundle:', error)
      return null
    }
  }

  /**
   * Generate a complete list of placeholder surahs
   */
  private generatePlaceholderSurahs(): EnhancedSurah[] {
    console.log('Generating placeholder surah list')

    return Array.from({ length: 114 }, (_, i) => ({
      number: i + 1,
      name: `سورة ${i + 1}`,
      englishName: `Surah ${i + 1}`,
      englishNameTranslation: `Surah ${i + 1}`,
      numberOfAyahs: 1,
      revelationType: 'Unknown',
      source: DataSource.GENERATED,
      ayahs: [], // Not including full ayahs in list view
    }))
  }

  /**
   * Download a resource for offline use
   */
  async downloadResource(resourceId: string): Promise<boolean> {
    await this.initialize()

    // Check if resource exists in our metadata
    const resource = this.availableResources.find((r) => r.id === resourceId)
    if (!resource) {
      console.error(`Resource ${resourceId} not found in available resources`)
      return false
    }

    // Check if already downloaded
    if (resource.status === ContentStatus.AVAILABLE) {
      console.log(`Resource ${resourceId} is already downloaded`)
      return true
    }

    // Add to download queue if not already there
    if (!this.downloadQueue.includes(resourceId)) {
      this.downloadQueue.push(resourceId)
      resource.status = ContentStatus.DOWNLOADING

      // Start download process if not already running
      if (!this.isDownloading) {
        this.processDownloadQueue()
      }
    }

    return true
  }

  /**
   * Process the download queue
   */
  private async processDownloadQueue(): Promise<void> {
    if (this.downloadQueue.length === 0 || this.isDownloading) {
      return
    }

    this.isDownloading = true

    while (this.downloadQueue.length > 0) {
      const resourceId = this.downloadQueue[0]

      try {
        const resource = this.availableResources.find(
          (r) => r.id === resourceId,
        )
        if (!resource) {
          console.error(`Resource ${resourceId} not found, skipping download`)
          this.downloadQueue.shift() // Remove from queue
          continue
        }

        // Check network connectivity
        const networkState = await Network.fetch()
        if (!networkState.isConnected) {
          console.log('Network not available, pausing download queue')
          break // Stop processing but keep items in queue
        }

        console.log(`Downloading resource: ${resource.name} (${resource.id})`)

        // This is where you'd make your API call to fetch the resource
        // For now, we'll simulate a download with a delay

        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Create a placeholder resource file
        const resourcePath = this.getResourcePath(resource)
        await FileSystem.writeAsStringAsync(
          resourcePath,
          JSON.stringify({
            id: resource.id,
            name: resource.name,
            type: resource.type,
            content: 'This is placeholder content for ' + resource.name,
            downloadedAt: Date.now(),
          }),
        )

        console.log(`Downloaded resource ${resourceId}`)

        // Update resource status
        resource.status = ContentStatus.AVAILABLE

        // Remove from queue
        this.downloadQueue.shift()

        // Save updated metadata
        await AsyncStorage.setItem(
          METADATA_KEY,
          JSON.stringify({
            resources: this.availableResources,
            lastUpdated: Date.now(),
          }),
        )
      } catch (error) {
        console.error(`Error downloading resource ${resourceId}:`, error)

        // Update resource status to error
        const resource = this.availableResources.find(
          (r) => r.id === resourceId,
        )
        if (resource) {
          resource.status = ContentStatus.ERROR
        }

        // Remove from queue and continue with next
        this.downloadQueue.shift()
      }
    }

    this.isDownloading = false
    console.log('Download queue processing completed')
  }

  /**
   * Get list of available downloadable resources
   */
  async getAvailableResources(): Promise<ResourceMetadata[]> {
    await this.initialize()
    return this.availableResources
  }

  /**
   * Check if a specific resource is downloaded and available
   */
  async isResourceAvailable(resourceId: string): Promise<boolean> {
    await this.initialize()

    const resource = this.availableResources.find((r) => r.id === resourceId)
    if (!resource) return false

    return resource.status === ContentStatus.AVAILABLE
  }

  /**
   * Delete a downloaded resource to free up space
   */
  async deleteResource(resourceId: string): Promise<boolean> {
    await this.initialize()

    const resource = this.availableResources.find((r) => r.id === resourceId)
    if (!resource) {
      console.error(`Resource ${resourceId} not found`)
      return false
    }

    if (resource.status !== ContentStatus.AVAILABLE) {
      console.log(`Resource ${resourceId} is not downloaded, nothing to delete`)
      return true // Nothing to delete
    }

    try {
      const resourcePath = this.getResourcePath(resource)
      const fileInfo = await FileSystem.getInfoAsync(resourcePath)

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(resourcePath)
      }

      // If this was a recitation, also delete audio files
      if (resource.type === ResourceType.RECITATION) {
        // In a real implementation, you'd delete associated audio files
        // For this example, we're just updating the status
      }

      // Update resource status
      resource.status = ContentStatus.NOT_AVAILABLE

      // Save updated metadata
      await AsyncStorage.setItem(
        METADATA_KEY,
        JSON.stringify({
          resources: this.availableResources,
          lastUpdated: Date.now(),
        }),
      )

      console.log(`Deleted resource ${resourceId}`)
      return true
    } catch (error) {
      console.error(`Error deleting resource ${resourceId}:`, error)
      return false
    }
  }

  /**
   * Get the size of all downloaded resources in bytes
   */
  async getTotalStorageUsed(): Promise<number> {
    await this.initialize()

    try {
      let totalSize = 0

      // Sum up the size of all resource files
      for (const resource of this.availableResources) {
        if (resource.status === ContentStatus.AVAILABLE) {
          const resourcePath = this.getResourcePath(resource)
          const fileInfo = await FileSystem.getInfoAsync(resourcePath)

          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size
          }
        }
      }

      // Add the size of cached surah files
      const surahFiles = await FileSystem.readDirectoryAsync(SURAHS_DIR)
      for (const file of surahFiles) {
        const filePath = `${SURAHS_DIR}${file}`
        const fileInfo = await FileSystem.getInfoAsync(filePath)

        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size
        }
      }

      // Add the size of audio files
      const audioFiles = await FileSystem.readDirectoryAsync(AUDIO_DIR)
      for (const file of audioFiles) {
        const filePath = `${AUDIO_DIR}${file}`
        const fileInfo = await FileSystem.getInfoAsync(filePath)

        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size
        }
      }

      return totalSize
    } catch (error) {
      console.error('Error calculating storage usage:', error)
      return 0
    }
  }

  /**
   * Clear all downloaded resources and cached data
   */
  async clearAllData(): Promise<boolean> {
    try {
      // Delete all directories
      await FileSystem.deleteAsync(QURAN_BASE_DIR, { idempotent: true })

      // Recreate empty directories
      await this.ensureDirectoriesExist()

      // Reset metadata
      await AsyncStorage.removeItem(METADATA_KEY)

      // Reset internal state
      this.availableResources = []
      this.downloadQueue = []
      this.isDownloading = false
      this.initialized = false

      console.log('All data cleared successfully')

      // Re-initialize
      await this.initialize()

      return true
    } catch (error) {
      console.error('Error clearing all data:', error)
      return false
    }
  }
}

export default QuranStorageService
