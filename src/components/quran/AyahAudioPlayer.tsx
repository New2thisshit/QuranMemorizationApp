// src/components/quran/AyahAudioPlayer.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { useQuran } from '../../contexts/QuranContext'
import NetInfo from '@react-native-community/netinfo'

interface AyahAudioPlayerProps {
  surahNumber: number
  ayahNumber: number
}

const AyahAudioPlayer: React.FC<AyahAudioPlayerProps> = ({
  surahNumber,
  ayahNumber,
}) => {
  const {
    loadAyahAudio,
    isLoading,
    audioUrl,
    isOnline,
    isAudioAvailable,
  } = useQuran()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Load the audio URL when component mounts or when surah/ayah changes
  useEffect(() => {
    loadAudio()
    return () => {
      // Clean up sound when component unmounts
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [surahNumber, ayahNumber])

  // Set up sound when audio URL changes from context
  useEffect(() => {
    if (audioUrl) {
      setupSound(audioUrl)
    }
  }, [audioUrl])

  const checkNetworkConnectivity = async (): Promise<boolean> => {
    const netInfo = await NetInfo.fetch()
    return netInfo.isConnected ?? false
  }

  const loadAudio = async () => {
    try {
      setError(null)

      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity()
      if (!isConnected) {
        setError(
          'No internet connection. Audio playback is unavailable offline.',
        )
        return
      }

      // Call the context function to load the audio URL
      // This doesn't return the URL but stores it in context state
      await loadAyahAudio(surahNumber, ayahNumber)

      // We'll access the audioUrl through the context in the useEffect above
    } catch (err) {
      console.error('Failed to load audio:', err)
      setError(
        'Audio content is currently unavailable. Please try again later.',
      )
    }
  }

  const setupSound = async (url: string) => {
    // Unload any existing sound
    if (sound) {
      await sound.unloadAsync()
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false },
        onPlaybackStatusUpdate,
      )
      setSound(newSound)
    } catch (err) {
      console.error('Error loading sound:', err)
      setError('Could not load audio. Please try again later.')
    }
  }

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0)
      setPosition(status.positionMillis || 0)
      setIsPlaying(status.isPlaying)

      if ('didJustFinish' in status && status.didJustFinish) {
        setIsPlaying(false)
      }
    }
  }

  const playSound = async () => {
    if (!sound && audioUrl) {
      await setupSound(audioUrl)
    }

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync()
      } else {
        // If we've reached the end, start from beginning
        if (position >= duration && duration > 0) {
          await sound.setPositionAsync(0)
        }
        await sound.playAsync()
      }
    } else if (!isLoading && !error) {
      // Try loading again if not already loading and no error
      loadAudio()
    }
  }

  // Format milliseconds to MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Render different content based on online/offline status
  const renderContent = () => {
    if (error || (!isOnline && !isAudioAvailable)) {
      // Error state or offline without cached audio
      return (
        <Text style={styles.errorText}>
          {error ||
            'Audio unavailable offline. Connect to download recitations.'}
        </Text>
      )
    } else {
      // Normal player state
      return (
        <>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width:
                    duration > 0 ? `${(position / duration) * 100}%` : '0%',
                },
              ]}
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>
              {duration > 0 ? formatTime(duration) : '--:--'}
            </Text>
          </View>
        </>
      )
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.playButton,
          !isOnline && !isAudioAvailable ? styles.disabledButton : null,
        ]}
        onPress={playSound}
        disabled={isLoading || !!error || (!isOnline && !isAudioAvailable)}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="white"
          />
        )}
      </TouchableOpacity>

      <View style={styles.progressContainer}>{renderContent()}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  progressContainer: {
    flex: 1,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2E8B57',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
})

export default AyahAudioPlayer
