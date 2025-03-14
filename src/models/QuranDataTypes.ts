// src/models/QuranDataTypes.ts
// Comprehensive type definitions for Quran data management

// Import base interfaces
import type { Ayah, Surah } from './Surah'

// Data source tracking for analytics and debugging
export enum DataSource {
  BUNDLED = 'bundled', // From app bundle
  CACHED = 'cached', // From local storage cache
  NETWORK = 'network', // Freshly fetched from API
  GENERATED = 'generated', // Placeholder data
}

// Status of content availability
export enum ContentStatus {
  AVAILABLE = 'available', // Content is ready to use
  DOWNLOADING = 'downloading', // Content is being downloaded
  NOT_AVAILABLE = 'not_available', // Content exists but isn't downloaded
  ERROR = 'error', // Error occurred with this content
}

// Resource types that can be downloaded
export enum ResourceType {
  TRANSLATION = 'translation',
  RECITATION = 'recitation',
  TAFSIR = 'tafsir',
}

// Interface for download progress tracking
export interface DownloadProgress {
  resourceId: string
  resourceType: ResourceType
  progress: number // 0-100
  bytesDownloaded?: number
  totalBytes?: number
  status: ContentStatus
  error?: string
}

// Basic metadata for Quran resources
export interface ResourceMetadata {
  id: string
  name: string
  englishName: string
  language: string
  type: ResourceType
  author?: string
  size?: number // Size in bytes if known
  version?: string
  lastUpdated?: string
  status: ContentStatus
}

// Extended from our existing Ayah interface
export interface EnhancedAyah extends Ayah {
  source?: DataSource
  translations?: {
    [translationId: string]: {
      text: string
      source?: DataSource
    }
  }
  recitations?: {
    [reciterId: string]: {
      audioUrl: string
      source?: DataSource
      status: ContentStatus
    }
  }
  tafsirs?: {
    [tafsirId: string]: {
      text: string
      source?: DataSource
    }
  }
}

// Extended from our existing Surah interface
export interface EnhancedSurah extends Omit<Surah, 'ayahs'> {
  source?: DataSource
  ayahs: EnhancedAyah[]
  downloadStatus?: {
    [resourceId: string]: ContentStatus
  }
  lastSyncTime?: number
  cachedAt?: number
}

// User preferences for data management
export interface DataPreferences {
  autoDownloadFavorites: boolean
  preferredTranslation: string
  preferredRecitation: string
  preferredTafsir: string
  downloadOnWifiOnly: boolean
  maxStorageUsage: number // In MB
}

// Re-export the basic types for compatibility
export type { Ayah, Surah } from './Surah'
