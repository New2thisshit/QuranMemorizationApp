// src/screens/memorization/QuranViewScreen.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  Animated,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'

// Components
import MushafView from '../../components/quran/MushafView'
import { DisplayMode } from '../../components/quran/MushafView'

// Contexts and APIs
import { useQuran } from '../../contexts/QuranContext'
import * as quranApi from '../../api/quran'

// Types
import { Surah, Ayah } from '../../models/Surah'
import { MemorizationStackParamList } from '../../types/navigation'

type QuranViewRouteProp = RouteProp<
  {
    QuranView: { surahId: number; ayahId?: number }
  },
  'QuranView'
>

type QuranViewNavigationProp = StackNavigationProp<
  MemorizationStackParamList,
  'QuranView'
>

interface QuranViewScreenProps {
  route: QuranViewRouteProp
  navigation: QuranViewNavigationProp
}

const QuranViewScreen: React.FC<QuranViewScreenProps> = ({
  route,
  navigation,
}) => {
  const { surahId, ayahId = 1 } = route.params || { surahId: 1, ayahId: 1 }
  const { currentSurah, setSurah, isLoading } = useQuran()

  // User preferences
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    DisplayMode.ARABIC_ONLY,
  )
  const [useMushafView, setUseMushafView] = useState(true)
  const [showTajweedColors, setShowTajweedColors] = useState(true)
  const [fontSize, setFontSize] = useState(28)
  const [preferredReciter, setPreferredReciter] = useState('mishari_alafasy')
  const [autoPlayAudio, setAutoPlayAudio] = useState(false)
  const [nightMode, setNightMode] = useState(false)

  // UI state
  const [currentAyah, setCurrentAyah] = useState<number>(ayahId)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioPosition, setAudioPosition] = useState(0)
  const [showControls, setShowControls] = useState(true)

  // Animated values for UI elements
  const scrollY = useRef(new Animated.Value(0)).current
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const headerHeight = useRef(
    new Animated.Value(Platform.OS === 'ios' ? 90 : 70),
  ).current

  // Screen dimensions
  const { width, height } = Dimensions.get('window')

  // Load surah data and user preferences on component mount
  useEffect(() => {
    loadUserPreferences()
    loadSurah()

    return () => {
      // Clean up audio when component unmounts
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  // Update navigation title when surah data is loaded
  useEffect(() => {
    if (currentSurah) {
      navigation.setOptions({
        title: currentSurah.englishName,
      })
    }
  }, [currentSurah, navigation])

  // Auto-play audio if preference is set
  useEffect(() => {
    if (currentSurah && autoPlayAudio && !playing) {
      playAyahAudio(currentAyah)
    }
  }, [currentSurah, currentAyah, autoPlayAudio])

  // Handle controls visibility
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (showControls) {
      timeout = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => setShowControls(false))
      }, 3000)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [showControls])

  // Load the surah data
  const loadSurah = async () => {
    try {
      await setSurah(surahId)
    } catch (error) {
      console.error('Error loading surah:', error)
      Alert.alert('Error', 'Failed to load surah data. Please try again.')
    }
  }

  // Load user preferences from AsyncStorage
  const loadUserPreferences = async () => {
    try {
      // Load display mode
      const storedDisplayMode = await AsyncStorage.getItem('quran_display_mode')
      if (storedDisplayMode) {
        setDisplayMode(storedDisplayMode as DisplayMode)
      }

      // Load Mushaf view preference
      const storedUseMushafView = await AsyncStorage.getItem('use_mushaf_mode')
      if (storedUseMushafView !== null) {
        setUseMushafView(storedUseMushafView === 'true')
      }

      // Load Tajweed colors preference
      const storedShowTajweedColors = await AsyncStorage.getItem(
        'show_tajweed_colors',
      )
      if (storedShowTajweedColors !== null) {
        setShowTajweedColors(storedShowTajweedColors === 'true')
      }

      // Load font size preference
      const storedFontSize = await AsyncStorage.getItem('quran_font_size')
      if (storedFontSize) {
        setFontSize(parseInt(storedFontSize, 10))
      }

      // Load preferred reciter
      const storedPreferredReciter = await AsyncStorage.getItem(
        'preferred_reciter',
      )
      if (storedPreferredReciter) {
        setPreferredReciter(storedPreferredReciter)
      }

      // Load auto-play preference
      const storedAutoPlayAudio = await AsyncStorage.getItem(
        'auto_play_recitation',
      )
      if (storedAutoPlayAudio !== null) {
        setAutoPlayAudio(storedAutoPlayAudio === 'true')
      }

      // Load night mode preference
      const storedNightMode = await AsyncStorage.getItem('night_mode')
      if (storedNightMode !== null) {
        setNightMode(storedNightMode === 'true')
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    }
  }

  // Play the audio for a specific ayah
  const playAyahAudio = async (ayahNumber: number) => {
    try {
      // First stop any currently playing audio
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
      }

      setLoadingAudio(true)
      setPlaying(false)

      // Get the ayah from the current surah
      if (!currentSurah) return

      const ayah = currentSurah.ayahs.find(
        (a) => a.numberInSurah === ayahNumber,
      )
      if (!ayah) return

      // Get the audio URL for this ayah (in a real app, this would come from an API)
      // For simplicity, we'll use a fake URL pattern
      const audioUrl = `https://verse.quran.com/${preferredReciter}/${surahId}/${ayahNumber}.mp3`

      try {
        // Load the audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setAudioPosition(status.positionMillis / 1000)
              setAudioDuration(
                status.durationMillis ? status.durationMillis / 1000 : 0,
              )
              setPlaying(status.isPlaying)
            }
          },
        )

        setSound(newSound)
        setPlaying(true)

        // When the playback finishes, reset the state
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setPlaying(false)
              setAudioPosition(0)
            }
          }
        })
      } catch (audioError) {
        // Handle the error if the audio URL doesn't work
        console.error('Error loading audio:', audioError)
        Alert.alert(
          'Audio Error',
          'Failed to play the recitation. Please try again.',
        )
      }
    } catch (error) {
      console.error('Error playing ayah audio:', error)
    } finally {
      setLoadingAudio(false)
    }
  }

  // Handle playing or pausing the current audio
  const togglePlayPause = async () => {
    if (!sound) {
      // If no sound is loaded, play the current ayah
      playAyahAudio(currentAyah)
      return
    }

    try {
      if (playing) {
        await sound.pauseAsync()
      } else {
        await sound.playAsync()
      }
    } catch (error) {
      console.error('Error toggling play state:', error)
    }
  }

  // Handle pressing the next ayah button
  const goToNextAyah = () => {
    if (!currentSurah) return

    // If we're at the last ayah, go to the next surah (if possible)
    if (currentAyah >= currentSurah.numberOfAyahs) {
      // If there is a next surah
      if (surahId < 114) {
        navigation.replace('QuranView', { surahId: surahId + 1, ayahId: 1 })
      }
      return
    }

    // Otherwise, go to the next ayah
    setCurrentAyah(currentAyah + 1)

    // If auto-play is enabled, play the new ayah
    if (autoPlayAudio) {
      playAyahAudio(currentAyah + 1)
    }
  }

  // Handle pressing the previous ayah button
  const goToPreviousAyah = () => {
    // If we're at the first ayah, go to the previous surah (if possible)
    if (currentAyah <= 1) {
      // If there is a previous surah
      if (surahId > 1) {
        // Navigate to the previous surah's last ayah
        // This would need to fetch the previous surah's details first
        // For simplicity, we'll just go to the first ayah of the previous surah
        navigation.replace('QuranView', { surahId: surahId - 1, ayahId: 1 })
      }
      return
    }

    // Otherwise, go to the previous ayah
    setCurrentAyah(currentAyah - 1)

    // If auto-play is enabled, play the new ayah
    if (autoPlayAudio) {
      playAyahAudio(currentAyah - 1)
    }
  }

  // Handle changing the display mode
  const changeDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode)
    // Save the preference
    AsyncStorage.setItem('quran_display_mode', mode)
  }

  // Toggle the UI controls visibility
  const toggleControls = () => {
    if (showControls) {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowControls(false))
    } else {
      setShowControls(true)
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }

  // Format time in seconds to MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  // Navigate to the settings screen
  const goToSettings = () => {
    navigation.navigate('QuranSettings')
  }

  // Handle ayah selection in the MushafView component
  const handleAyahPress = (ayah: Ayah) => {
    setCurrentAyah(ayah.numberInSurah)
    if (autoPlayAudio) {
      playAyahAudio(ayah.numberInSurah)
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, nightMode && styles.nightModeContainer]}
    >
      <StatusBar
        barStyle={nightMode ? 'light-content' : 'dark-content'}
        backgroundColor={nightMode ? '#1A1A1A' : '#FFFFFF'}
      />

      {/* Touchable area to toggle controls */}
      <TouchableOpacity
        style={styles.touchableArea}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {isLoading || !currentSurah ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text
              style={[styles.loadingText, nightMode && styles.nightModeText]}
            >
              Loading Quran...
            </Text>
          </View>
        ) : (
          <View style={styles.quranViewContainer}>
            {/* Quran content - Using MushafView component */}
            <MushafView
              surah={currentSurah}
              initialAyah={currentAyah}
              onAyahPress={handleAyahPress}
              showHeader={false}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Header Controls - Animates to hide/show */}
      {showControls && (
        <Animated.View
          style={[
            styles.headerControls,
            { opacity: controlsOpacity },
            nightMode && styles.nightModeHeader,
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={nightMode ? '#FFFFFF' : '#333333'}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, nightMode && styles.nightModeText]}>
            {currentSurah?.englishName || 'Quran'}{' '}
            {currentAyah && `(${currentAyah})`}
          </Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={goToSettings}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={nightMode ? '#FFFFFF' : '#333333'}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Display Mode Controls */}
      {showControls && (
        <Animated.View
          style={[
            styles.displayControls,
            { opacity: controlsOpacity },
            nightMode && styles.nightModeControls,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.displayOption,
              displayMode === DisplayMode.ARABIC_ONLY &&
                styles.activeDisplayOption,
            ]}
            onPress={() => changeDisplayMode(DisplayMode.ARABIC_ONLY)}
          >
            <Text
              style={[
                styles.displayOptionText,
                displayMode === DisplayMode.ARABIC_ONLY &&
                  styles.activeDisplayOptionText,
                nightMode &&
                  displayMode !== DisplayMode.ARABIC_ONLY &&
                  styles.nightModeText,
              ]}
            >
              Arabic
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.displayOption,
              displayMode === DisplayMode.ARABIC_TRANSLATION &&
                styles.activeDisplayOption,
            ]}
            onPress={() => changeDisplayMode(DisplayMode.ARABIC_TRANSLATION)}
          >
            <Text
              style={[
                styles.displayOptionText,
                displayMode === DisplayMode.ARABIC_TRANSLATION &&
                  styles.activeDisplayOptionText,
                nightMode &&
                  displayMode !== DisplayMode.ARABIC_TRANSLATION &&
                  styles.nightModeText,
              ]}
            >
              Translation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.displayOption,
              displayMode === DisplayMode.ARABIC_TRANSLITERATION &&
                styles.activeDisplayOption,
            ]}
            onPress={() =>
              changeDisplayMode(DisplayMode.ARABIC_TRANSLITERATION)
            }
          >
            <Text
              style={[
                styles.displayOptionText,
                displayMode === DisplayMode.ARABIC_TRANSLITERATION &&
                  styles.activeDisplayOptionText,
                nightMode &&
                  displayMode !== DisplayMode.ARABIC_TRANSLITERATION &&
                  styles.nightModeText,
              ]}
            >
              Transliteration
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.displayOption,
              displayMode === DisplayMode.ALL && styles.activeDisplayOption,
            ]}
            onPress={() => changeDisplayMode(DisplayMode.ALL)}
          >
            <Text
              style={[
                styles.displayOptionText,
                displayMode === DisplayMode.ALL &&
                  styles.activeDisplayOptionText,
                nightMode &&
                  displayMode !== DisplayMode.ALL &&
                  styles.nightModeText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom Controls - Audio Player & Navigation */}
      {showControls && (
        <Animated.View
          style={[
            styles.bottomControls,
            { opacity: controlsOpacity },
            nightMode && styles.nightModeControls,
          ]}
        >
          {/* Audio Controls */}
          <View style={styles.audioControlsContainer}>
            {/* Audio Progress */}
            <View style={styles.audioProgressContainer}>
              <Text
                style={[
                  styles.audioTimeText,
                  nightMode && styles.nightModeText,
                ]}
              >
                {formatTime(audioPosition)}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${(audioPosition / audioDuration) * 100}%` },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.audioTimeText,
                  nightMode && styles.nightModeText,
                ]}
              >
                {formatTime(audioDuration)}
              </Text>
            </View>

            {/* Audio Buttons */}
            <View style={styles.audioButtonsContainer}>
              <TouchableOpacity
                style={styles.audioButton}
                onPress={goToPreviousAyah}
              >
                <Ionicons
                  name="play-skip-back-circle"
                  size={32}
                  color={nightMode ? '#FFFFFF' : '#2E8B57'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayPause}
                disabled={loadingAudio}
              >
                {loadingAudio ? (
                  <ActivityIndicator
                    size="large"
                    color={nightMode ? '#FFFFFF' : '#2E8B57'}
                  />
                ) : (
                  <Ionicons
                    name={playing ? 'pause-circle' : 'play-circle'}
                    size={48}
                    color={nightMode ? '#FFFFFF' : '#2E8B57'}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.audioButton}
                onPress={goToNextAyah}
              >
                <Ionicons
                  name="play-skip-forward-circle"
                  size={32}
                  color={nightMode ? '#FFFFFF' : '#2E8B57'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Controls */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navigationButton,
                nightMode && styles.nightModeNavigationButton,
              ]}
              onPress={() => {
                if (surahId > 1) {
                  navigation.replace('QuranView', {
                    surahId: surahId - 1,
                    ayahId: 1,
                  })
                }
              }}
              disabled={surahId <= 1}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={
                  surahId <= 1 ? '#999999' : nightMode ? '#FFFFFF' : '#333333'
                }
              />
              <Text
                style={[
                  styles.navigationButtonText,
                  surahId <= 1 && styles.disabledNavigationButtonText,
                  nightMode && styles.nightModeText,
                ]}
              >
                Previous Surah
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navigationButton,
                nightMode && styles.nightModeNavigationButton,
              ]}
              onPress={() => {
                if (surahId < 114) {
                  navigation.replace('QuranView', {
                    surahId: surahId + 1,
                    ayahId: 1,
                  })
                }
              }}
              disabled={surahId >= 114}
            >
              <Text
                style={[
                  styles.navigationButtonText,
                  surahId >= 114 && styles.disabledNavigationButtonText,
                  nightMode && styles.nightModeText,
                ]}
              >
                Next Surah
              </Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  surahId >= 114 ? '#999999' : nightMode ? '#FFFFFF' : '#333333'
                }
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  nightModeContainer: {
    backgroundColor: '#1A1A1A',
  },
  touchableArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  quranViewContainer: {
    flex: 1,
  },
  headerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  nightModeHeader: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  settingsButton: {
    padding: 8,
  },
  displayControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  displayOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  activeDisplayOption: {
    backgroundColor: '#2E8B57',
  },
  displayOptionText: {
    fontSize: 12,
    color: '#666666',
  },
  activeDisplayOptionText: {
    color: '#FFFFFF',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  nightModeControls: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  audioControlsContainer: {
    marginBottom: 16,
  },
  audioProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  audioTimeText: {
    fontSize: 12,
    color: '#666666',
    width: 40,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2E8B57',
    borderRadius: 2,
  },
  audioButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButton: {
    padding: 8,
  },
  playPauseButton: {
    padding: 8,
    marginHorizontal: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  nightModeNavigationButton: {
    borderColor: '#333333',
  },
  navigationButtonText: {
    fontSize: 14,
    color: '#333333',
    marginHorizontal: 4,
  },
  disabledNavigationButtonText: {
    color: '#999999',
  },
  nightModeText: {
    color: '#FFFFFF',
  },
})

export default QuranViewScreen
