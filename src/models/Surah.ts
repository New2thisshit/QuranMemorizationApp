// Ayah model
export interface Ayah {
  number: number // Unique ID for the ayah across the Quran
  numberInSurah: number // Ayah number within its surah
  juz: number // Juz number (1-30)
  manzil: number // Manzil number (1-7)
  ruku: number // Ruku number
  hizbQuarter: number // Hizb quarter number
  sajda: boolean // Whether this ayah contains a sajda
  text: string // Arabic text of the ayah
  translation?: string // English translation of the ayah
  transliteration?: string // Latin transliteration of the ayah
  audioUrl?: string // URL to audio recitation of this ayah
  id?: string // Optional ID for database reference

  // Add these new properties
  surahId?: number // The ID of the surah this ayah belongs to
  surahName?: string // The name of the surah this ayah belongs to
}

// Surah model
export interface Surah {
  number: number // Surah number (1-114)
  name: string // Arabic name of the surah
  englishName: string // English name of the surah
  englishNameTranslation: string // Translation of the surah name
  numberOfAyahs: number // Number of ayahs in this surah
  revelationType: 'Meccan' | 'Medinan' | 'Unknown' // Whether revealed in Mecca or Medina
  ayahs: Ayah[] // Array of ayahs in this surah
}

// User progress for a specific ayah
export interface AyahProgress {
  userId: string // ID of the user
  ayahId: number // ID of the ayah
  surahId: number // ID of the surah
  dateMemorized: string | null // Date when fully memorized, or null if not yet
  lastReviewDate: string // Date of the last review
  reviewCount: number // Number of times reviewed
  lastScore: number // Score from the last review (0-100)
  status: 'new' | 'learning' | 'reviewing' | 'memorized' // Current status
}

// Overall surah memorization progress
export interface SurahProgress {
  userId: string // ID of the user
  surahId: number // ID of the surah
  ayahsStarted: number // Number of ayahs started
  ayahsMemorized: number // Number of ayahs fully memorized
  completionPercentage: number // Percentage of completion (0-100)
  lastReviewDate: string | null // Date of the last review
  averageScore: number // Average score across all ayahs
}
