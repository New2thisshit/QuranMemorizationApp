// src/screens/memorization/MemorizationScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native'
import { useAppNavigation } from '../../hooks/useAppNavigation'
import { Ionicons } from '@expo/vector-icons'

// Contexts
import { useQuran } from '../../contexts/QuranContext'
import { useAuth } from '../../contexts/AuthContext'

// API Services
import * as recitationApi from '../../api/recitation'

// Types
interface SurahProgress {
  surahId: number
  surahName: string
  completionPercentage: number
  lastReview: string
  totalAyahs: number
  memorizedAyahs: number
}

interface MemorizationSession {
  surahId: number
  surahName: string
  ayahStart: number
  ayahEnd: number
  avgScore: number
  date: string
}

/**
 * MemorizationScreen serves as the dashboard and main entry point
 * for the Quran memorization features. It shows personalized recommendations,
 * current memorization progress, and provides quick access to continue
 * previously started surahs or start new ones.
 */
const MemorizationScreen: React.FC = () => {
  const navigation = useAppNavigation()
  const { width } = useWindowDimensions()
  const { user } = useAuth()
  const { surahs, isLoading: isSurahsLoading, fetchSurahs } = useQuran()

  const [userProgress, setUserProgress] = useState<SurahProgress[]>([])
  const [recentSessions, setRecentSessions] = useState<MemorizationSession[]>(
    [],
  )
  const [recommendations, setRecommendations] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMemorized, setTotalMemorized] = useState({
    ayahs: 0,
    percentage: 0,
  })

  // Ensure Quran data is loaded
  useEffect(() => {
    if (surahs.length === 0 && !isSurahsLoading) {
      fetchSurahs()
    }
  }, [surahs, isSurahsLoading, fetchSurahs])

  // Load user data and recommendations on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch user progress data (with error handling)
        let progress
        try {
          progress = await recitationApi.getRecitationStats()
        } catch (error) {
          console.error('Failed to fetch recitation stats:', error)
          progress = {
            totalAyahsMemorized: 0,
            memorizedSurahs: [],
            recentActivity: [],
          }
        }

        // Format surah progress data
        const surahProgress: SurahProgress[] = Array.isArray(
          progress.memorizedSurahs,
        )
          ? progress.memorizedSurahs.map((surah: any) => ({
              surahId: surah.surahId,
              surahName: surah.surahName,
              completionPercentage: surah.completionPercentage,
              lastReview: surah.lastReview || 'Never',
              totalAyahs: surah.totalAyahs,
              memorizedAyahs: surah.ayahsMemorized,
            }))
          : []

        // Sort by last review date (most recent first)
        surahProgress.sort((a, b) => {
          // Handle 'Never' case
          if (a.lastReview === 'Never') return 1
          if (b.lastReview === 'Never') return -1
          return (
            new Date(b.lastReview).getTime() - new Date(a.lastReview).getTime()
          )
        })

        setUserProgress(surahProgress)

        // Calculate total memorization stats
        const totalAyahs = 6236 // Total ayahs in the Quran
        const memorizedAyahs = progress.totalAyahsMemorized || 0
        const percentage = (memorizedAyahs / totalAyahs) * 100

        setTotalMemorized({
          ayahs: memorizedAyahs,
          percentage: parseFloat(percentage.toFixed(2)),
        })

        // Get recent memorization sessions
        let history
        try {
          history = await recitationApi.getRecitationHistory(1, 10)
        } catch (error) {
          console.error('Failed to fetch recitation history:', error)
          history = { data: [] }
        }

        // Process history data for recent sessions
        const sessions: MemorizationSession[] = []
        if (history && Array.isArray(history.data)) {
          const recentSessions = history.data.slice(0, 5)
          for (const session of recentSessions) {
            sessions.push({
              surahId: session.surahId,
              surahName: getSurahName(session.surahId),
              ayahStart: session.ayahId,
              ayahEnd: session.ayahId,
              avgScore: session.score,
              date: new Date(session.timestamp).toLocaleDateString(),
            })
          }
        }

        setRecentSessions(sessions)

        // Generate personalized recommendations
        generateRecommendations(surahProgress)
      } catch (error) {
        console.error('Error loading user data:', error)
        // Set default states to prevent UI errors
        setUserProgress([])
        setRecentSessions([])
        setRecommendations([1, 36, 67, 78, 55]) // Default popular surahs
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user, surahs])

  // Get surah name by ID
  const getSurahName = (surahId: number): string => {
    const surah = surahs.find((s) => s.number === surahId)
    return surah ? surah.englishName : `Surah ${surahId}`
  }

  // Generate personalized recommendations based on user progress
  const generateRecommendations = (progress: SurahProgress[]) => {
    // Simple recommendation logic (can be enhanced)
    const recommended: number[] = []

    // Add surahs close to completion but not fully memorized
    const almostComplete = progress
      .filter(
        (s) => s.completionPercentage >= 70 && s.completionPercentage < 100,
      )
      .sort((a, b) => b.completionPercentage - a.completionPercentage)
      .slice(0, 2)

    almostComplete.forEach((s) => recommended.push(s.surahId))

    // Add some short surahs for beginners if they haven't started many
    if (progress.length < 5) {
      // Short surahs from the end of the Quran
      ;[114, 112, 108, 103, 106].forEach((id) => {
        if (!progress.some((s) => s.surahId === id) && recommended.length < 5) {
          recommended.push(id)
        }
      })
    }

    // Add common surahs that are popular for memorization
    ;[1, 36, 67, 78, 55].forEach((id) => {
      if (
        !progress.some((s) => s.surahId === id) &&
        !recommended.includes(id) &&
        recommended.length < 5
      ) {
        recommended.push(id)
      }
    })

    setRecommendations(recommended)
  }

  // Navigate to surah list
  const handleBrowseSurahs = () => {
    navigation.navigate('SurahList')
  }

  // Continue memorizing a specific surah
  const handleContinueSurah = (surahId: number) => {
    navigation.navigate('AyahList', { surahId })
  }

  // Format date string for display
  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return 'Never'

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  // Render surah progress card
  const renderSurahProgressCard = ({ item }: { item: SurahProgress }) => (
    <TouchableOpacity
      style={styles.surahCard}
      onPress={() => handleContinueSurah(item.surahId)}
    >
      <View style={styles.surahCardHeader}>
        <View style={styles.surahNumberCircle}>
          <Text style={styles.surahNumber}>{item.surahId}</Text>
        </View>
        <View style={styles.surahInfo}>
          <Text style={styles.surahName}>{item.surahName}</Text>
          <Text style={styles.surahStats}>
            {item.memorizedAyahs} of {item.totalAyahs} ayahs
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${item.completionPercentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(item.completionPercentage)}% Complete
        </Text>
      </View>

      <Text style={styles.lastReviewText}>
        Last reviewed: {formatDate(item.lastReview)}
      </Text>
    </TouchableOpacity>
  )

  // Render a recommended surah
  const renderRecommendation = ({ item }: { item: number }) => {
    const surah = surahs.find((s) => s.number === item)
    if (!surah) return null

    return (
      <TouchableOpacity
        style={[styles.recommendationCard, { width: width * 0.7 }]}
        onPress={() => handleContinueSurah(item)}
      >
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationNumberCircle}>
            <Text style={styles.recommendationNumber}>{surah.number}</Text>
          </View>
          <View style={styles.recommendationInfo}>
            <Text style={styles.recommendationName}>{surah.englishName}</Text>
            <Text style={styles.recommendationDetails}>
              {surah.revelationType} • {surah.numberOfAyahs} Ayahs
            </Text>
          </View>
        </View>

        <Text style={styles.arabicName}>{surah.name}</Text>

        <View style={styles.startButtonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleContinueSurah(item)}
          >
            <Text style={styles.startButtonText}>Start Memorizing</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quran Memorization</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={handleBrowseSurahs}
          >
            <Ionicons name="list-outline" size={20} color="#2E8B57" />
            <Text style={styles.browseButtonText}>Browse All</Text>
          </TouchableOpacity>
        </View>

        {/* Overall Progress Card */}
        <View style={styles.overallProgressCard}>
          <Text style={styles.overallProgressTitle}>Total Memorization</Text>
          <View style={styles.overallProgressCircle}>
            <Text style={styles.overallProgressPercentage}>
              {totalMemorized.percentage}%
            </Text>
          </View>
          <Text style={styles.overallProgressDetails}>
            {totalMemorized.ayahs} of 6236 Ayahs Memorized
          </Text>
          <TouchableOpacity
            style={styles.viewProgressButton}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={styles.viewProgressButtonText}>
              View Detailed Progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Learning Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Continue Memorizing</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#2E8B57" />
          ) : userProgress.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="book-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                You haven't started memorizing any surahs yet.
              </Text>
              <TouchableOpacity
                style={styles.startMemorizingButton}
                onPress={handleBrowseSurahs}
              >
                <Text style={styles.startMemorizingButtonText}>
                  Start Memorizing
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={userProgress.slice(0, 3)}
              renderItem={renderSurahProgressCard}
              keyExtractor={(item) => item.surahId.toString()}
              scrollEnabled={false}
              ListFooterComponent={
                userProgress.length > 3 ? (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={handleBrowseSurahs}
                  >
                    <Text style={styles.showMoreButtonText}>
                      View All ({userProgress.length})
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#2E8B57"
                    />
                  </TouchableOpacity>
                ) : null
              }
            />
          )}
        </View>

        {/* Recommendations Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>

          {isLoading || isSurahsLoading ? (
            <ActivityIndicator size="large" color="#2E8B57" />
          ) : recommendations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="star-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                No recommendations available yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={recommendations}
              renderItem={renderRecommendation}
              keyExtractor={(item) => item.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendationsContainer}
              snapToInterval={width * 0.7 + 16}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          )}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#2E8B57" />
          ) : recentSessions.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="time-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                No recent activity to display.
              </Text>
            </View>
          ) : (
            <View style={styles.recentActivityContainer}>
              {recentSessions.map((session, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.activityItem}
                  onPress={() =>
                    navigation.navigate('Recite', {
                      surahId: session.surahId,
                      ayahId: session.ayahStart,
                    })
                  }
                >
                  <View style={styles.activityIconContainer}>
                    <Ionicons name="book" size={20} color="#2E8B57" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      Practiced {session.surahName}
                      {session.ayahStart === session.ayahEnd
                        ? ` (Ayah ${session.ayahStart})`
                        : ` (Ayahs ${session.ayahStart}-${session.ayahEnd})`}
                    </Text>
                    <Text style={styles.activityDetails}>
                      Score: {Math.round(session.avgScore)}% • {session.date}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewAllActivityButton}
                onPress={() => navigation.navigate('RecitationHistory')}
              >
                <Text style={styles.viewAllActivityText}>
                  View All Activity
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 14,
    color: '#2E8B57',
    marginLeft: 4,
  },
  overallProgressCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overallProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  overallProgressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallProgressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  overallProgressDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  viewProgressButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewProgressButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    marginBottom: 16,
    color: '#999999',
    textAlign: 'center',
  },
  startMemorizingButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startMemorizingButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  surahCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  surahCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  surahNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  surahNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  surahStats: {
    fontSize: 12,
    color: '#666666',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2E8B57',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  lastReviewText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  showMoreButtonText: {
    fontSize: 14,
    color: '#2E8B57',
    marginRight: 4,
  },
  recommendationsContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  recommendationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  recommendationDetails: {
    fontSize: 12,
    color: '#666666',
  },
  arabicName: {
    fontSize: 24,
    color: '#2E8B57',
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
  },
  startButtonContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  recentActivityContainer: {
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: '#666666',
  },
  viewAllActivityButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  viewAllActivityText: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
  },
})

export default MemorizationScreen
