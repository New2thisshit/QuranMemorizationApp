// src/components/quran/MushafView.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Types
import { Ayah, Surah } from '../../models/Surah'

// Constants for display modes
export enum DisplayMode {
  ARABIC_ONLY = 'arabic_only',
  ARABIC_TRANSLATION = 'arabic_translation',
  ARABIC_TRANSLITERATION = 'arabic_transliteration',
  ALL = 'all',
}

interface MushafViewProps {
  surah: Surah
  initialAyah?: number
  onAyahPress?: (ayah: Ayah) => void
  showHeader?: boolean
}

const MushafView: React.FC<MushafViewProps> = ({
  surah,
  initialAyah = 1,
  onAyahPress,
  showHeader = true,
}) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    DisplayMode.ARABIC_ONLY,
  )
  const [loading, setLoading] = useState(false)
  const [fontSize, setFontSize] = useState(28)
  const [selectedAyah, setSelectedAyah] = useState<number>(initialAyah)
  const [pageAyahs, setPageAyahs] = useState<number[]>([])
  const windowWidth = Dimensions.get('window').width

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences()
  }, [])

  // Scroll to initial ayah if specified
  useEffect(() => {
    if (initialAyah > 1) {
      setSelectedAyah(initialAyah)
    }
  }, [initialAyah])

  // Load user preferences from AsyncStorage
  const loadUserPreferences = async () => {
    try {
      const storedDisplayMode = await AsyncStorage.getItem('quran_display_mode')
      const storedFontSize = await AsyncStorage.getItem('quran_font_size')

      if (storedDisplayMode) {
        setDisplayMode(storedDisplayMode as DisplayMode)
      }

      if (storedFontSize) {
        setFontSize(parseInt(storedFontSize, 10))
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    }
  }

  // Save user preferences to AsyncStorage
  const saveUserPreferences = async () => {
    try {
      await AsyncStorage.setItem('quran_display_mode', displayMode)
      await AsyncStorage.setItem('quran_font_size', fontSize.toString())
    } catch (error) {
      console.error('Error saving user preferences:', error)
    }
  }

  // Handle changing display mode
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode)
    saveUserPreferences()
  }

  // Handle font size change
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize)
    saveUserPreferences()
  }

  // Handle ayah selection
  const handleAyahPress = (ayah: Ayah) => {
    setSelectedAyah(ayah.numberInSurah)
    if (onAyahPress) {
      onAyahPress(ayah)
    }
  }

  // Create ayah groups for Mushaf style pages
  // In real Quran, the pages don't split ayahs between pages, so we need to handle this
  const getAyahGroups = () => {
    const groups: Ayah[][] = []
    let currentGroup: Ayah[] = []
    let currentLength = 0

    surah.ayahs.forEach((ayah) => {
      // Estimate ayah length based on text length
      const ayahLength = (ayah.text.length / 50) * 100 // Rough estimate

      // If adding this ayah would exceed the page, start a new group
      if (currentLength + ayahLength > 800 && currentGroup.length > 0) {
        groups.push([...currentGroup])
        currentGroup = [ayah]
        currentLength = ayahLength
      } else {
        currentGroup.push(ayah)
        currentLength += ayahLength
      }
    })

    // Add the last group if it has any ayahs
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  // Render a single ayah based on display mode
  const renderAyah = (ayah: Ayah, index: number) => {
    const isSelected = ayah.numberInSurah === selectedAyah
    const isFirst = index === 0 && ayah.numberInSurah === 1

    return (
      <TouchableOpacity
        key={ayah.number}
        style={[
          styles.ayahContainer,
          isSelected && styles.selectedAyahContainer,
        ]}
        onPress={() => handleAyahPress(ayah)}
      >
        {/* Ayah number circle */}
        <View style={styles.ayahNumberCircle}>
          <Text style={styles.ayahNumberText}>{ayah.numberInSurah}</Text>
        </View>

        <View style={styles.ayahContentContainer}>
          {/* Arabic text */}
          <Text style={[styles.arabicText, { fontSize: fontSize }]}>
            {isFirst && surah.number !== 9
              ? '' // Bismillah is separate in Mushaf view for first ayah
              : ayah.text + ' '}
          </Text>

          {/* Transliteration (if enabled) */}
          {(displayMode === DisplayMode.ARABIC_TRANSLITERATION ||
            displayMode === DisplayMode.ALL) && (
            <Text style={styles.transliterationText}>
              {ayah.transliteration || 'Transliteration not available'}
            </Text>
          )}

          {/* Translation (if enabled) */}
          {(displayMode === DisplayMode.ARABIC_TRANSLATION ||
            displayMode === DisplayMode.ALL) && (
            <Text style={styles.translationText}>
              {ayah.translation || 'Translation not available'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{surah.englishName}</Text>
          <Text style={styles.headerSubtitle}>
            {surah.englishNameTranslation}
          </Text>

          {/* Display Mode Options */}
          <View style={styles.displayOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.displayOption,
                displayMode === DisplayMode.ARABIC_ONLY &&
                  styles.activeDisplayOption,
              ]}
              onPress={() => handleDisplayModeChange(DisplayMode.ARABIC_ONLY)}
            >
              <Text style={styles.displayOptionText}>Arabic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.displayOption,
                displayMode === DisplayMode.ARABIC_TRANSLATION &&
                  styles.activeDisplayOption,
              ]}
              onPress={() =>
                handleDisplayModeChange(DisplayMode.ARABIC_TRANSLATION)
              }
            >
              <Text style={styles.displayOptionText}>Translation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.displayOption,
                displayMode === DisplayMode.ARABIC_TRANSLITERATION &&
                  styles.activeDisplayOption,
              ]}
              onPress={() =>
                handleDisplayModeChange(DisplayMode.ARABIC_TRANSLITERATION)
              }
            >
              <Text style={styles.displayOptionText}>Transliteration</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.displayOption,
                displayMode === DisplayMode.ALL && styles.activeDisplayOption,
              ]}
              onPress={() => handleDisplayModeChange(DisplayMode.ALL)}
            >
              <Text style={styles.displayOptionText}>All</Text>
            </TouchableOpacity>
          </View>

          {/* Font Size Options */}
          <View style={styles.fontSizeContainer}>
            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => handleFontSizeChange(Math.max(16, fontSize - 2))}
            >
              <Ionicons name="remove" size={20} color="#2E8B57" />
            </TouchableOpacity>

            <Text style={styles.fontSizeText}>{fontSize}</Text>

            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => handleFontSizeChange(Math.min(48, fontSize + 2))}
            >
              <Ionicons name="add" size={20} color="#2E8B57" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bismillah */}
      {surah.number !== 9 && (
        <View style={styles.bismillahContainer}>
          <Text style={[styles.bismillahText, { fontSize: fontSize }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      )}

      {/* Scrollable Quran Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading Quran text...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.mushafContainer}>
            {surah.ayahs.map((ayah, index) => renderAyah(ayah, index))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#F9F9F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  displayOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  displayOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
  },
  activeDisplayOption: {
    backgroundColor: '#2E8B57',
  },
  displayOptionText: {
    fontSize: 12,
    color: '#333333',
  },
  fontSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  fontSizeText: {
    fontSize: 14,
    color: '#333333',
  },
  bismillahContainer: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  bismillahText: {
    fontSize: 28,
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
    color: '#2E8B57',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  mushafContainer: {
    padding: 16,
  },
  ayahContainer: {
    marginBottom: 16,
  },
  selectedAyahContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 8,
  },
  ayahNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginLeft: 8,
  },
  ayahNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ayahContentContainer: {
    marginTop: 8,
  },
  arabicText: {
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
    fontSize: 28,
    lineHeight: 50,
    textAlign: 'right',
    color: '#333333',
  },
  transliterationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555555',
    marginTop: 8,
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
})

export default MushafView
