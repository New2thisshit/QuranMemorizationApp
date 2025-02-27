import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

// API Services
import * as recitationApi from '../../api/recitation'

/**
 * StatsScreen provides detailed statistical analysis of the user's memorization progress.
 * It displays various metrics and charts to help users understand their performance trends.
 */
const StatsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [stats, setStats] = useState({
    totalTimeSpent: 0, // In minutes
    averageSessionDuration: 0, // In minutes
    sessionsCompleted: 0,
    daysActive: 0,
    bestDay: {
      date: '',
      ayahsReviewed: 0,
      score: 0,
    },
    improvementRate: 0, // Percentage increase in scores
    memorizedByJuz: [
      { juz: 1, completed: 0, total: 0 },
      { juz: 2, completed: 0, total: 0 },
      { juz: 3, completed: 0, total: 0 },
    ],
  })

  // Load detailed statistics based on selected time range
  useEffect(() => {
    const loadDetailedStats = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call with the timeRange parameter
        // Simulating an API call with a timeout
        setTimeout(() => {
          // Mock data
          const mockStats = {
            totalTimeSpent: 420, // 7 hours
            averageSessionDuration: 15,
            sessionsCompleted: 28,
            daysActive: 22,
            bestDay: {
              date: '2023-06-15',
              ayahsReviewed: 35,
              score: 92,
            },
            improvementRate: 12.5,
            memorizedByJuz: [
              { juz: 1, completed: 25, total: 148 },
              { juz: 2, completed: 18, total: 111 },
              { juz: 3, completed: 5, total: 125 },
            ],
          }

          setStats(mockStats)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Failed to load detailed stats:', error)
        setIsLoading(false)
      }
    }

    loadDetailedStats()
  }, [timeRange])

  // Format minutes into hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

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
      <ScrollView>
        {/* Time Range Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeRange === 'week' && styles.activeFilterButton,
            ]}
            onPress={() => setTimeRange('week')}
          >
            <Text
              style={[
                styles.filterButtonText,
                timeRange === 'week' && styles.activeFilterButtonText,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              timeRange === 'month' && styles.activeFilterButton,
            ]}
            onPress={() => setTimeRange('month')}
          >
            <Text
              style={[
                styles.filterButtonText,
                timeRange === 'month' && styles.activeFilterButtonText,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              timeRange === 'year' && styles.activeFilterButton,
            ]}
            onPress={() => setTimeRange('year')}
          >
            <Text
              style={[
                styles.filterButtonText,
                timeRange === 'year' && styles.activeFilterButtonText,
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <>
            {/* Time Stats Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Stats</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={24} color="#2E8B57" />
                  <Text style={styles.statValue}>
                    {formatTime(stats.totalTimeSpent)}
                  </Text>
                  <Text style={styles.statLabel}>Total Time</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons
                    name="hourglass-outline"
                    size={24}
                    color="#2E8B57"
                  />
                  <Text style={styles.statValue}>
                    {formatTime(stats.averageSessionDuration)}
                  </Text>
                  <Text style={styles.statLabel}>Avg Session</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="calendar-outline" size={24} color="#2E8B57" />
                  <Text style={styles.statValue}>
                    {stats.daysActive}/
                    {timeRange === 'week'
                      ? 7
                      : timeRange === 'month'
                      ? 30
                      : 365}
                  </Text>
                  <Text style={styles.statLabel}>Days Active</Text>
                </View>
              </View>
            </View>

            {/* Performance Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance</Text>

              <View style={styles.performanceContainer}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>
                    Sessions Completed
                  </Text>
                  <Text style={styles.performanceValue}>
                    {stats.sessionsCompleted}
                  </Text>
                </View>

                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Improvement Rate</Text>
                  <Text style={styles.performanceValue}>
                    {stats.improvementRate}%
                  </Text>
                </View>

                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Best Day</Text>
                  <Text style={styles.performanceValue}>
                    {formatDate(stats.bestDay.date)}
                  </Text>
                  <Text style={styles.performanceSubtext}>
                    {stats.bestDay.ayahsReviewed} ayahs • {stats.bestDay.score}%
                    avg score
                  </Text>
                </View>
              </View>
            </View>

            {/* Juz Progress */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progress by Juz</Text>

              {stats.memorizedByJuz.map((juz) => (
                <View key={juz.juz} style={styles.juzItem}>
                  <View style={styles.juzHeader}>
                    <Text style={styles.juzTitle}>Juz {juz.juz}</Text>
                    <Text style={styles.juzProgress}>
                      {juz.completed}/{juz.total} ayahs (
                      {Math.round((juz.completed / juz.total) * 100)}%)
                    </Text>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${(juz.completed / juz.total) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#2E8B57',
  },
  filterButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  performanceContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  performanceSubtext: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  juzItem: {
    marginBottom: 16,
  },
  juzHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  juzTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  juzProgress: {
    fontSize: 14,
    color: '#666666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2E8B57',
    borderRadius: 4,
  },
})

export default StatsScreen
