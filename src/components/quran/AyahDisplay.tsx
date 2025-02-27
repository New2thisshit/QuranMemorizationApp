import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ayah } from '../../models/Surah'

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
}

const AyahDisplay: React.FC<AyahDisplayProps> = ({
  ayah,
  isCurrentAyah = false,
  tajweedHighlights = [],
  showTranslation = true,
  showTransliteration = false,
  fontSize = 24,
}) => {
  // Split the Arabic text into words for individual styling
  const arabicWords = ayah.text.split(' ')

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
  },
  ayahNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  arabicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  arabicText: {
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
    fontSize: 24,
    textAlign: 'right',
    color: '#333333',
  },
  transliteration: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 6,
  },
  translation: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
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
