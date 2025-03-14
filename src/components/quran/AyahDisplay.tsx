import React from 'react'
import { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ayah } from '../../models/Surah'
import { DisplayMode } from './MushafView'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AyahDisplayProps {
  ayah: Ayah
  isCurrentAyah?: boolean
  tajweedHighlights?: {
    wordIndex: number
    ruleId: string
  }[]
  showTranslation?: boolean
  showTransliteration?: boolean
  fontSize?: number
  userLanguage?: string
}

const AyahDisplay: React.FC<AyahDisplayProps> = ({
  ayah,
  isCurrentAyah = false,
  tajweedHighlights = [],
  showTranslation = true,
  showTransliteration = false,
  fontSize = 24,
  userLanguage = 'en',
}) => {
  // Split the Arabic text into words for individual styling
  const arabicWords = ayah.text.split(' ')

  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    DisplayMode.ARABIC_ONLY,
  )

  useEffect(() => {
    const loadDisplayMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('quran_display_mode')
        if (storedMode) {
          setDisplayMode(storedMode as DisplayMode)
        }
      } catch (error) {
        console.error('Error loading display mode:', error)
      }
    }

    loadDisplayMode()
  }, [])

  // Function to determine if a word has a tajweed highlight
  const getWordHighlight = (index: number) => {
    const highlight = tajweedHighlights.find((h) => h.wordIndex === index)
    if (!highlight) return null

    // Return different colors based on the tajweed rule
    switch (highlight.ruleId) {
      case 'idgham':
        return styles.idghamHighlight
      case 'ikhfa':
        return styles.ikhfaHighlight
      case 'qalqalah':
        return styles.qalqalahHighlight
      case 'madd':
        return styles.maddHighlight
      case 'ghunnah':
        return styles.ghunnahHighlight
      default:
        return styles.generalHighlight
    }
  }

  return (
    <View
      style={[
        styles.container,
        isCurrentAyah ? styles.currentAyahContainer : null,
      ]}
    >
      {/* Ayah number */}
      <View style={styles.ayahNumberContainer}>
        <Text style={styles.ayahNumber}>{ayah.numberInSurah}</Text>
      </View>

      {/* Arabic text */}
      <View style={styles.textContainer}>
        <View style={styles.arabicContainer}>
          {arabicWords.map((word, index) => (
            <Text
              key={`word-${index}`}
              style={[styles.arabicText, { fontSize }, getWordHighlight(index)]}
            >
              {word}{' '}
            </Text>
          ))}
        </View>

        {/* Transliteration (if enabled) */}
        {showTransliteration && ayah.transliteration && (
          <Text style={styles.transliteration}>{ayah.transliteration}</Text>
        )}

        {/* Translation (if enabled) */}
        {showTranslation && ayah.translation && (
          <Text style={styles.translation}>{ayah.translation}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  currentAyahContainer: {
    backgroundColor: '#F5F5F5',
  },
  ayahNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ayahNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  arabicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 8,
  },
  arabicText: {
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
    fontSize: 24,
    textAlign: 'right',
    color: '#333333',
    lineHeight: 40,
  },
  transliteration: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 10,
    width: '100%',
    lineHeight: 24,
  },
  translation: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    width: '100%',
    lineHeight: 20,
    marginTop: 4,
  },
  // Tajweed highlight styles
  idghamHighlight: {
    color: '#4CAF50', // Green
  },
  ikhfaHighlight: {
    color: '#2196F3', // Blue
  },
  qalqalahHighlight: {
    color: '#F44336', // Red
  },
  maddHighlight: {
    color: '#9C27B0', // Purple
  },
  ghunnahHighlight: {
    color: '#FF9800', // Orange
  },
  generalHighlight: {
    color: '#607D8B', // Blue Grey
  },
})

export default AyahDisplay
