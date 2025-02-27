import React, { createContext, useState, useContext, useEffect } from 'react'
import * as quranApi from '../api/quran'
import { Surah, Ayah } from '../models/Surah'

type QuranContextType = {
  surahs: Surah[]
  currentSurah: Surah | null
  currentAyah: Ayah | null
  isLoading: boolean
  error: string | null
  fetchSurahs: () => Promise<void>
  setSurah: (surahNumber: number) => Promise<void>
  setAyah: (ayahNumber: number) => void
  getNextAyah: () => Ayah | null
  getPreviousAyah: () => Ayah | null
}

const QuranContext = createContext<QuranContextType | undefined>(undefined)

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null)
  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSurahs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await quranApi.getAllSurahs()
      setSurahs(data)
    } catch (err) {
      setError('Failed to fetch Quran data')
      console.error('Error fetching surahs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const setSurah = async (surahNumber: number) => {
    setIsLoading(true)
    setError(null)
    try {
      // Find the surah from our array or fetch it if not loaded
      let surah = surahs.find((s) => s.number === surahNumber)

      if (!surah) {
        surah = await quranApi.getSurah(surahNumber)
      }

      setCurrentSurah(surah)

      // Set the first ayah as current by default
      if (surah.ayahs && surah.ayahs.length > 0) {
        setCurrentAyah(surah.ayahs[0])
      } else {
        setCurrentAyah(null)
      }
    } catch (err) {
      setError(`Failed to load Surah ${surahNumber}`)
      console.error(`Error setting surah ${surahNumber}:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  const setAyah = (ayahNumber: number) => {
    if (!currentSurah || !currentSurah.ayahs) {
      setError('No surah selected')
      return
    }

    const ayah = currentSurah.ayahs.find((a) => a.number === ayahNumber)
    if (ayah) {
      setCurrentAyah(ayah)
    } else {
      setError(`Ayah ${ayahNumber} not found in current surah`)
    }
  }

  const getNextAyah = (): Ayah | null => {
    if (!currentSurah || !currentAyah) return null

    const currentIndex = currentSurah.ayahs.findIndex(
      (a) => a.number === currentAyah.number,
    )
    if (currentIndex < currentSurah.ayahs.length - 1) {
      return currentSurah.ayahs[currentIndex + 1]
    }

    // If at the end of the surah, return null
    return null
  }

  const getPreviousAyah = (): Ayah | null => {
    if (!currentSurah || !currentAyah) return null

    const currentIndex = currentSurah.ayahs.findIndex(
      (a) => a.number === currentAyah.number,
    )
    if (currentIndex > 0) {
      return currentSurah.ayahs[currentIndex - 1]
    }

    // If at the beginning of the surah, return null
    return null
  }

  useEffect(() => {
    fetchSurahs()
  }, [])

  return (
    <QuranContext.Provider
      value={{
        surahs,
        currentSurah,
        currentAyah,
        isLoading,
        error,
        fetchSurahs,
        setSurah,
        setAyah,
        getNextAyah,
        getPreviousAyah,
      }}
    >
      {children}
    </QuranContext.Provider>
  )
}

export const useQuran = () => {
  const context = useContext(QuranContext)
  if (context === undefined) {
    throw new Error('useQuran must be used within a QuranProvider')
  }
  return context
}
