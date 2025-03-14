import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  NavigationProp,
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import {
  AppTabParamList,
  MemorizationStackParamList,
  ProgressStackParamList,
} from '../../types/navigation'

// Contexts
import { useAuth } from '../../contexts/AuthContext'
import { useQuran } from '../../contexts/QuranContext'

// API Services
import * as recitationApi from '../../api/recitation'

//import custom hooks
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

// Types
type RecitationStats = {
  totalAyahsMemorized: number
  averageScore: number
  memorizedSurahs: {
    surahId: number
    surahName: string
    completionPercentage: number
    lastReview: string
  }[]
  recentActivity: {
    date: string
    ayahsReviewed: number
    averageScore: number
  }[]
}

// Define a combined type for the navigation
// type CombinedNavigation = AppTabParamList & {
//   Memorize: { screen?: keyof MemorizationStackParamList; params?: any }
//   Progress: { screen?: keyof ProgressStackParamList } | undefined
// }

// Define a composite navigation type
type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  StackNavigationProp<MemorizationStackParamList>
>

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { user } = useAuth()
  const { surahs, isLoading: isSurahsLoading } = useQuran()

  const [stats, setStats] = useState<RecitationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Calculate the greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Format a date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Load user's recitation stats
  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await recitationApi.getRecitationStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load recitation stats:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true)
    loadStats()
  }

  // Load stats on initial render
  useEffect(() => {
    loadStats()
  }, [])

  // Navigate to the memorization screen
  const handleStartMemorizing = () => {
    ;(navigation.navigate as any)('Memorize', { screen: 'SurahList' })
  }

  // Navigate to a specific surah
  const handleContinueMemorizing = (surahId: number) => {
    ;(navigation.navigate as any)('Memorize', {
      screen: 'AyahList',
      params: { surahId },
    })
  }
  // Navigate to the progress screen
  const handleViewProgress = () => {
    ;(navigation.navigate as any)('Progress')
  }
  const goToQuranView = () => {
    // Navigate to the Memorize tab first, then to the QuranView screen
    navigation.navigate('Memorize', {
      screen: 'QuranView',
      params: { surahId: 1 },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E8B57']}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.username}>{user?.name || 'Hafiz'}</Text>
          </View>
          <Image
            source={require('../../../assets/images/quran-logo.png')}
            style={styles.logo}
          />
        </View>

        {/* Quick Stats Section */}
        <View style={styles.quickStatsContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2E8B57" />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats?.totalAyahsMemorized || 0}
                </Text>
                <Text style={styles.statLabel}>Ayahs Memorized</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats?.memorizedSurahs.length || 0}
                </Text>
                <Text style={styles.statLabel}>Surahs Started</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats?.averageScore
                    ? `${Math.round(stats.averageScore)}%`
                    : '0%'}
                </Text>
                <Text style={styles.statLabel}>Average Score</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartMemorizing}
          >
            <Ionicons name="book-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Start Memorizing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewProgress}
          >
            <Ionicons name="stats-chart-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>View Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={goToQuranView}>
            <Ionicons name="book-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Mushaf View</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Memorizing Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Continue Memorizing</Text>

          {isLoading || isSurahsLoading ? (
            <ActivityIndicator size="small" color="#2E8B57" />
          ) : stats?.memorizedSurahs.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="book-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                You haven't started memorizing any surahs yet.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScrollView}
            >
              {stats?.memorizedSurahs.map((surah) => {
                const surahDetails = surahs.find(
                  (s) => s.number === surah.surahId,
                )
                return (
                  <TouchableOpacity
                    key={surah.surahId}
                    style={styles.surahCard}
                    onPress={() => handleContinueMemorizing(surah.surahId)}
                  >
                    <View style={styles.surahNumberCircle}>
                      <Text style={styles.surahNumber}>{surah.surahId}</Text>
                    </View>
                    <Text style={styles.surahName}>{surah.surahName}</Text>
                    <Text style={styles.surahNameArabic}>
                      {surahDetails?.name || ''}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${surah.completionPercentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(surah.completionPercentage)}% Complete
                    </Text>
                    <Text style={styles.lastReviewText}>
                      Last reviewed: {formatDate(surah.lastReview)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {isLoading ? (
            <ActivityIndicator size="small" color="#2E8B57" />
          ) : stats?.recentActivity.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="time-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                No recent activity to display.
              </Text>
            </View>
          ) : (
            <View style={styles.activityContainer}>
              {stats?.recentActivity.slice(0, 5).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityDateContainer}>
                    <Text style={styles.activityDate}>
                      {formatDate(activity.date)}
                    </Text>
                  </View>
                  <View style={styles.activityDetailsContainer}>
                    <Text style={styles.activityDetails}>
                      <Text style={styles.activityHighlight}>
                        {activity.ayahsReviewed}
                      </Text>{' '}
                      ayahs reviewed
                    </Text>
                    <Text style={styles.activityScore}>
                      Avg. Score: {Math.round(activity.averageScore)}%
                    </Text>
                  </View>
                </View>
              ))}
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
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quickStatsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2E8B57',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
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
  horizontalScrollView: {
    paddingLeft: 16,
  },
  surahCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  surahNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  surahNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  surahName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  surahNameArabic: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 12,
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2E8B57',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  lastReviewText: {
    fontSize: 10,
    color: '#999999',
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    marginTop: 8,
    color: '#999999',
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  activityDateContainer: {
    width: 80,
  },
  activityDate: {
    fontSize: 12,
    color: '#999999',
  },
  activityDetailsContainer: {
    flex: 1,
  },
  activityDetails: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  activityHighlight: {
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  activityScore: {
    fontSize: 12,
    color: '#666666',
  },
})

export default HomeScreen
