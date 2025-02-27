import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'

// API Services
import * as recitationApi from '../../api/recitation'

// Types
type RecitationSession = {
  id: string
  ayahId: number
  surahId: number
  surahName: string
  ayahNumber: number
  date: string
  score: number
  duration: number // in seconds
  recordingUri?: string
}

/**
 * RecitationHistoryScreen displays a log of all previous recitation sessions,
 * allowing users to review their progress over time and replay past recitations.
 */
const RecitationHistoryScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<RecitationSession[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Load recitation history
  useEffect(() => {
    loadHistory()
  }, [])

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  // Load history from API
  const loadHistory = async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await recitationApi.getRecitationHistory(page)

      if (page === 1) {
        setHistory(response.data)
      } else {
        setHistory((prevHistory) => [...prevHistory, ...response.data])
      }

      setHasMorePages(response.hasMore)
      setCurrentPage(page)
    } catch (error) {
      console.error('Failed to load recitation history:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Load more history when reaching the end of the list
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMorePages) {
      loadHistory(currentPage + 1)
    }
  }

  // Play a recitation recording
  const playRecording = async (session: RecitationSession) => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
      }

      // If we're already playing this recording, just stop
      if (playingId === session.id) {
        setPlayingId(null)
        return
      }

      // If there's no recording URI, we can't play anything
      if (!session.recordingUri) {
        return
      }

      // Load and play the recording
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: session.recordingUri },
        { shouldPlay: true },
      )

      setSound(newSound)
      setPlayingId(session.id)

      // When playback finishes, clean up
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null)
        }
      })
    } catch (error) {
      console.error('Failed to play recording:', error)
      setPlayingId(null)
    }
  }

  // Format a date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format duration in seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Get the appropriate icon based on the score
  const getScoreIcon = (score: number) => {
    if (score >= 90) return 'checkmark-circle'
    if (score >= 75) return 'thumbs-up'
    if (score >= 60) return 'alert-circle'
    return 'warning'
  }

  // Get the color based on the score
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50' // Green
    if (score >= 75) return '#8BC34A' // Light Green
    if (score >= 60) return '#FFC107' // Amber
    return '#F44336' // Red
  }

  // Render a single recitation session item
  const renderRecitationItem = ({ item }: { item: RecitationSession }) => (
    <View style={styles.recitationItem}>
      <View style={styles.recitationHeader}>
        <View>
          <Text style={styles.recitationSurah}>
            {item.surahName} ({item.surahId}:{item.ayahNumber})
          </Text>
          <Text style={styles.recitationDate}>{formatDate(item.date)}</Text>
        </View>

        <View
          style={[
            styles.scoreContainer,
            { backgroundColor: `${getScoreColor(item.score)}20` },
          ]}
        >
          <Ionicons
            name={getScoreIcon(item.score) as any}
            size={16}
            color={getScoreColor(item.score)}
            style={styles.scoreIcon}
          />
          <Text
            style={[styles.scoreText, { color: getScoreColor(item.score) }]}
          >
            {Math.round(item.score)}%
          </Text>
        </View>
      </View>

      <View style={styles.recitationDetails}>
        <Text style={styles.durationText}>
          Duration: {formatDuration(item.duration)}
        </Text>

        {item.recordingUri && (
          <TouchableOpacity
            style={[
              styles.playButton,
              playingId === item.id && styles.playingButton,
            ]}
            onPress={() => playRecording(item)}
          >
            <Ionicons
              name={playingId === item.id ? 'stop' : 'play'}
              size={16}
              color="white"
            />
            <Text style={styles.playButtonText}>
              {playingId === item.id ? 'Stop' : 'Play'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  // Render a loading indicator at the bottom when loading more items
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#2E8B57" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading recitation history...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mic-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            No recitation history found. Start memorizing to see your progress
            here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderRecitationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
  },
  recitationItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  recitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recitationSurah: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  recitationDate: {
    fontSize: 12,
    color: '#666666',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreIcon: {
    marginRight: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  recitationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666666',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E8B57',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playingButton: {
    backgroundColor: '#F44336',
  },
  playButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    color: '#666666',
  },
})

export default RecitationHistoryScreen
