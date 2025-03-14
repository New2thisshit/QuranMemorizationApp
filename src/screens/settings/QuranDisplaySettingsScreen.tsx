// src/screens/settings/QuranDisplaySettingsScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DisplayMode } from '../../components/quran/MushafView'
import Slider from '@react-native-community/slider'

const QuranDisplaySettingsScreen: React.FC = () => {
  // Get settings from the parent UserSettings if possible
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    DisplayMode.ARABIC_ONLY,
  )
  const [arabicFontSize, setArabicFontSize] = useState(28)
  const [translationFontSize, setTranslationFontSize] = useState(16)
  const [transliterationFontSize, setTransliterationFontSize] = useState(14)
  const [showTajweedColors, setShowTajweedColors] = useState(true)
  const [useMushafView, setUseMushafView] = useState(true)
  const [nightMode, setNightMode] = useState(false)
  const [wordByWordTranslation, setWordByWordTranslation] = useState(false)

  // Load user preferences on component mount
  useEffect(() => {
    loadUserPreferences()
  }, [])

  // Load from AsyncStorage
  const loadUserPreferences = async () => {
    try {
      // Load display mode
      const storedDisplayMode = await AsyncStorage.getItem('quran_display_mode')
      if (storedDisplayMode) {
        setDisplayMode(storedDisplayMode as DisplayMode)
      }

      // Load font sizes
      const storedArabicFontSize = await AsyncStorage.getItem('quran_font_size')
      if (storedArabicFontSize) {
        setArabicFontSize(parseInt(storedArabicFontSize, 10))
      }

      const storedTranslationFontSize = await AsyncStorage.getItem(
        'translation_font_size',
      )
      if (storedTranslationFontSize) {
        setTranslationFontSize(parseInt(storedTranslationFontSize, 10))
      }

      const storedTransliterationFontSize = await AsyncStorage.getItem(
        'transliteration_font_size',
      )
      if (storedTransliterationFontSize) {
        setTransliterationFontSize(parseInt(storedTransliterationFontSize, 10))
      }

      // Load boolean preferences
      const storedShowTajweedColors = await AsyncStorage.getItem(
        'show_tajweed_colors',
      )
      if (storedShowTajweedColors !== null) {
        setShowTajweedColors(storedShowTajweedColors === 'true')
      }

      const storedUseMushafView = await AsyncStorage.getItem('use_mushaf_mode')
      if (storedUseMushafView !== null) {
        setUseMushafView(storedUseMushafView === 'true')
      }

      const storedNightMode = await AsyncStorage.getItem('night_mode')
      if (storedNightMode !== null) {
        setNightMode(storedNightMode === 'true')
      }

      const storedWordByWordTranslation = await AsyncStorage.getItem(
        'word_by_word_translation',
      )
      if (storedWordByWordTranslation !== null) {
        setWordByWordTranslation(storedWordByWordTranslation === 'true')
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
      Alert.alert(
        'Error',
        'Failed to load your preferences. Default settings will be used.',
      )
    }
  }

  // Save individual settings
  const savePreference = async (key: string, value: any) => {
    try {
      if (typeof value === 'boolean') {
        await AsyncStorage.setItem(key, value.toString())
      } else if (typeof value === 'number') {
        await AsyncStorage.setItem(key, value.toString())
      } else {
        await AsyncStorage.setItem(key, value)
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error)
    }
  }

  // Handle changing display mode
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode)
    savePreference('quran_display_mode', mode)
  }

  // Handle changing font size
  const handleArabicFontSizeChange = (size: number) => {
    setArabicFontSize(size)
    savePreference('quran_font_size', size)
  }

  const handleTranslationFontSizeChange = (size: number) => {
    setTranslationFontSize(size)
    savePreference('translation_font_size', size)
  }

  const handleTransliterationFontSizeChange = (size: number) => {
    setTransliterationFontSize(size)
    savePreference('transliteration_font_size', size)
  }

  // Handle toggle changes
  const handleShowTajweedColorsChange = (value: boolean) => {
    setShowTajweedColors(value)
    savePreference('show_tajweed_colors', value)
  }

  const handleUseMushafViewChange = (value: boolean) => {
    setUseMushafView(value)
    savePreference('use_mushaf_mode', value)
  }

  const handleNightModeChange = (value: boolean) => {
    setNightMode(value)
    savePreference('night_mode', value)
  }

  const handleWordByWordTranslationChange = (value: boolean) => {
    setWordByWordTranslation(value)
    savePreference('word_by_word_translation', value)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Mode</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleDisplayModeChange(DisplayMode.ARABIC_ONLY)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Arabic Only</Text>
              <Text style={styles.optionDescription}>
                Show only the Arabic text
              </Text>
            </View>
            {displayMode === DisplayMode.ARABIC_ONLY && (
              <Ionicons name="checkmark-circle" size={24} color="#2E8B57" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              handleDisplayModeChange(DisplayMode.ARABIC_TRANSLATION)
            }
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Arabic with Translation</Text>
              <Text style={styles.optionDescription}>
                Show Arabic with translation
              </Text>
            </View>
            {displayMode === DisplayMode.ARABIC_TRANSLATION && (
              <Ionicons name="checkmark-circle" size={24} color="#2E8B57" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              handleDisplayModeChange(DisplayMode.ARABIC_TRANSLITERATION)
            }
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>
                Arabic with Transliteration
              </Text>
              <Text style={styles.optionDescription}>
                Show Arabic with transliteration
              </Text>
            </View>
            {displayMode === DisplayMode.ARABIC_TRANSLITERATION && (
              <Ionicons name="checkmark-circle" size={24} color="#2E8B57" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleDisplayModeChange(DisplayMode.ALL)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Show All</Text>
              <Text style={styles.optionDescription}>
                Show Arabic, translation, and transliteration
              </Text>
            </View>
            {displayMode === DisplayMode.ALL && (
              <Ionicons name="checkmark-circle" size={24} color="#2E8B57" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font Sizes</Text>

          <Text style={styles.sliderLabel}>
            Arabic Text: {arabicFontSize}px
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={16}
            maximumValue={40}
            step={1}
            value={arabicFontSize}
            onValueChange={handleArabicFontSizeChange}
            minimumTrackTintColor="#2E8B57"
          />

          <Text style={styles.sliderLabel}>
            Translation Text: {translationFontSize}px
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={24}
            step={1}
            value={translationFontSize}
            onValueChange={handleTranslationFontSizeChange}
            minimumTrackTintColor="#2E8B57"
          />

          <Text style={styles.sliderLabel}>
            Transliteration Text: {transliterationFontSize}px
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={24}
            step={1}
            value={transliterationFontSize}
            onValueChange={handleTransliterationFontSizeChange}
            minimumTrackTintColor="#2E8B57"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Options</Text>

          <View style={styles.toggleOption}>
            <View>
              <Text style={styles.toggleLabel}>Use Mushaf Style View</Text>
              <Text style={styles.toggleDescription}>
                Traditional Quran page layout
              </Text>
            </View>
            <Switch
              value={useMushafView}
              onValueChange={handleUseMushafViewChange}
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleOption}>
            <View>
              <Text style={styles.toggleLabel}>Show Tajweed Colors</Text>
              <Text style={styles.toggleDescription}>
                Highlight tajweed rules in the text
              </Text>
            </View>
            <Switch
              value={showTajweedColors}
              onValueChange={handleShowTajweedColorsChange}
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleOption}>
            <View>
              <Text style={styles.toggleLabel}>Word by Word Translation</Text>
              <Text style={styles.toggleDescription}>
                Show translation for each word
              </Text>
            </View>
            <Switch
              value={wordByWordTranslation}
              onValueChange={handleWordByWordTranslationChange}
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleOption}>
            <View>
              <Text style={styles.toggleLabel}>Night Mode</Text>
              <Text style={styles.toggleDescription}>
                Dark background for better reading at night
              </Text>
            </View>
            <Switch
              value={nightMode}
              onValueChange={handleNightModeChange}
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    maxWidth: '80%',
  },
})

export default QuranDisplaySettingsScreen
