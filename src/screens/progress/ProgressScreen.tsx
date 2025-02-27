import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

// API Services
import * as recitationApi from '../../api/recitation'
import { useQuran } from '../../contexts/QuranContext'

// Types
type ProgressStats = {
  totalAyahsMemorized: number
  totalAyahsInQuran: number
  totalSurahsStarted: number
  totalSurahsCompleted: number
  weeklyProgress: {
    date: string
    ayahsMemorized: number
  }[]
  surahProgress: {
    surahId: number
    surahName: string
    ayahsMemorized: number
    totalAyahs: number
    lastReviewDate: string
    averageScore: number
  }[]
}

const ProgressScreen: React.FC = () => {
  const { surahs } = useQuran()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load progress stats
  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await recitationApi.getRecitationStats()

      // Transform the data to match our expected format
      const progressStats: ProgressStats = {
        totalAyahsMemorized: data.totalAyahsMemorized,
        totalAyahsInQuran: 6236, // Fixed value for total ayahs in the Quran
        totalSurahsStarted: data.memorizedSurahs.length,
        totalSurahsCompleted: data.memorizedSurahs.filter(
          (s) => s.completionPercentage === 100,
        ).length,
        weeklyProgress: data.recentActivity.map((a) => ({
          date: a.date,
          ayahsMemorized: a.ayahsReviewed,
        })),
        surahProgress: data.memorizedSurahs.map((s) => {
          const surahDetails = surahs.find(
            (surah) => surah.number === s.surahId,
          )
          return {
            surahId: s.surahId,
            surahName: s.surahName,
            ayahsMemorized: Math.round(
              (surahDetails?.numberOfAyahs || 0) *
                (s.completionPercentage / 100),
            ),
            totalAyahs: surahDetails?.numberOfAyahs || 0,
            lastReviewDate: s.lastReview,
            averageScore: 0, // This would come from the actual API
          }
        }),
      }

      setStats(progressStats)
    } catch (error) {
      console.error('Failed to load progress stats:', error)
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

  // Format a date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
          </View>
        ) : (
          <>
            {/* Overall Progress */}
            <View style={styles.overallProgressContainer}>
              <Text style={styles.sectionTitle}>Overall Progress</Text>

              {/* Progress Circle */}
              <View style={styles.progressCircleContainer}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercentage}>
                    {stats
                      ? Math.round(
                          (stats.totalAyahsMemorized /
                            stats.totalAyahsInQuran) *
                            100,
                        )
                      : 0}
                    %
                  </Text>
                </View>
                <Text style={styles.progressLabel}>of Quran Memorized</Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats?.totalAyahsMemorized || 0}
                  </Text>
                  <Text style={styles.statLabel}>Ayahs Memorized</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats?.totalSurahsStarted || 0}
                  </Text>
                  <Text style={styles.statLabel}>Surahs Started</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats?.totalSurahsCompleted || 0}
                  </Text>
                  <Text style={styles.statLabel}>Surahs Completed</Text>
                </View>
              </View>
            </View>

            {/* Weekly Progress */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Weekly Progress</Text>

              {stats?.weeklyProgress.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>
                    No weekly progress data available.
                  </Text>
                </View>
              ) : (
                <View style={styles.weeklyProgressContainer}>
                  {stats?.weeklyProgress.map((day, index) => (
                    <View key={index} style={styles.weeklyProgressItem}>
                      <Text style={styles.weeklyProgressDay}>
                        {formatDate(day.date)}
                      </Text>
                      <View style={styles.weeklyProgressBarContainer}>
                        <View
                          style={[
                            styles.weeklyProgressBar,
                            {
                              height: Math.min(100, day.ayahsMemorized * 4),
                              backgroundColor:
                                day.ayahsMemorized > 0 ? '#2E8B57' : '#EEEEEE',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.weeklyProgressValue}>
                        {day.ayahsMemorized}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Surah Progress */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Surah Progress</Text>

              {stats?.surahProgress.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>
                    No surah progress data available.
                  </Text>
                </View>
              ) : (
                <View style={styles.surahProgressContainer}>
                  {stats?.surahProgress.map((surah) => (
                    <View key={surah.surahId} style={styles.surahProgressItem}>
                      <View style={styles.surahProgressHeader}>
                        <View style={styles.surahNumberCircle}>
                          <Text style={styles.surahNumber}>
                            {surah.surahId}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.surahName}>
                            {surah.surahName}
                          </Text>
                          <Text style={styles.surahProgressStats}>
                            {surah.ayahsMemorized} of {surah.totalAyahs} ayahs
                            memorized
                          </Text>
                        </View>
                        <Text style={styles.surahProgressPercentage}>
                          {Math.round(
                            (surah.ayahsMemorized / surah.totalAyahs) * 100,
                          )}
                          %
                        </Text>
                      </View>

                      <View style={styles.surahProgressBarContainer}>
                        <View
                          style={[
                            styles.surahProgressBar,
                            {
                              width: `${
                                (surah.ayahsMemorized / surah.totalAyahs) * 100
                              }%`,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.surahProgressFooter}>
                        <Text style={styles.surahLastReviewed}>
                          Last reviewed: {formatDate(surah.lastReviewDate)}
                        </Text>
                        {surah.averageScore > 0 && (
                          <Text style={styles.surahAverageScore}>
                            Avg. score: {Math.round(surah.averageScore)}%
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  overallProgressContainer: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEEEEE',
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  emptyStateText: {
    color: '#999999',
    fontStyle: 'italic',
  },
  weeklyProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weeklyProgressItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyProgressDay: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
  },
  weeklyProgressBarContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  weeklyProgressBar: {
    width: 16,
    borderRadius: 8,
  },
  weeklyProgressValue: {
    fontSize: 10,
    color: '#666666',
  },
  surahProgressContainer: {
    marginTop: 8,
  },
  surahProgressItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  surahProgressHeader: {
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
  surahName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  surahProgressStats: {
    fontSize: 12,
    color: '#666666',
  },
  surahProgressPercentage: {
    marginLeft: 'auto',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  surahProgressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 12,
  },
  surahProgressBar: {
    height: 8,
    backgroundColor: '#2E8B57',
    borderRadius: 4,
  },
  surahProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surahLastReviewed: {
    fontSize: 10,
    color: '#999999',
    fontStyle: 'italic',
  },
  surahAverageScore: {
    fontSize: 10,
    color: '#666666',
  },
})

export default ProgressScreen
