import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'

// Contexts
import { useQuran } from '../../contexts/QuranContext'

// API Services
import * as recitationApi from '../../api/recitation'

// Types
type SurahDetailScreenRouteProp = RouteProp<
  {
    SurahDetail: { surahId: number }
  },
  'SurahDetail'
>

type SurahDetailScreenNavigationProp = StackNavigationProp<any, 'SurahDetail'>

type AyahProgress = {
  ayahId: number
  dateMemorized: string | null
  lastScore: number
  reviewCount: number
  status: 'new' | 'learning' | 'reviewing' | 'memorized'
  lastReview: string
}

interface SurahDetailScreenProps {
  route: SurahDetailScreenRouteProp
  navigation: SurahDetailScreenNavigationProp
}

/**
 * SurahDetailScreen shows detailed progress information for a specific surah,
 * including ayah-by-ayah progress, review history, and memorization stats.
 */
const SurahDetailScreen: React.FC<SurahDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { surahId } = route.params
  const { surahs } = useQuran()

  const [isLoading, setIsLoading] = useState(true)
  const [surahDetails, setSurahDetails] = useState<any>(null)
  const [ayahProgress, setAyahProgress] = useState<AyahProgress[]>([])
  const [filter, setFilter] = useState<
    'all' | 'memorized' | 'learning' | 'new'
  >('all')

  // Load surah details and progress
  useEffect(() => {
    const loadSurahDetails = async () => {
      setIsLoading(true)
      try {
        const surah = surahs.find((s) => s.number === surahId)
        setSurahDetails(surah)

        // Load progress for this surah
        const progress = await recitationApi.getSurahProgress(surahId)

        // Transform the ayah progress data
        const ayahProgressData: AyahProgress[] = []
        for (let i = 1; i <= (surah?.numberOfAyahs || 0); i++) {
          const progressData = progress.ayahsProgress.find(
            (p: any) => p.ayahNumber === i,
          )

          if (progressData) {
            ayahProgressData.push({
              ayahId: i,
              dateMemorized: progressData.dateMemorized,
              lastScore: progressData.lastScore,
              reviewCount: progressData.reviewCount,
              status: progressData.status,
              lastReview: progressData.lastReviewDate,
            })
          } else {
            // No progress data for this ayah
            ayahProgressData.push({
              ayahId: i,
              dateMemorized: null,
              lastScore: 0,
              reviewCount: 0,
              status: 'new',
              lastReview: '',
            })
          }
        }

        setAyahProgress(ayahProgressData)
      } catch (error) {
        console.error('Failed to load surah details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSurahDetails()

    // Update navigation title
    const surah = surahs.find((s) => s.number === surahId)
    if (surah) {
      navigation.setOptions({
        title: `${surah.englishName} Progress`,
      })
    }
  }, [surahId, surahs, navigation])

  // Format a date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'

    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Filter ayahs based on selected filter
  const filteredAyahs = () => {
    if (filter === 'all') return ayahProgress
    return ayahProgress.filter((ayah) => ayah.status === filter)
  }

  // Get count of ayahs in each status
  const getStatusCounts = () => {
    const counts = {
      memorized: 0,
      learning: 0,
      new: 0,
    }

    ayahProgress.forEach((ayah) => {
      if (ayah.status === 'memorized') counts.memorized++
      else if (ayah.status === 'learning' || ayah.status === 'reviewing')
        counts.learning++
      else counts.new++
    })

    return counts
  }

  // Get the style for the status badge
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'memorized':
        return styles.memorizedBadge
      case 'reviewing':
      case 'learning':
        return styles.learningBadge
      default:
        return styles.newBadge
    }
  }

  // Get the text for the status badge
  const getStatusText = (status: string) => {
    switch (status) {
      case 'memorized':
        return 'Memorized'
      case 'reviewing':
        return 'Reviewing'
      case 'learning':
        return 'Learning'
      default:
        return 'New'
    }
  }

  // Render a single ayah item
  const renderAyahItem = ({ item }: { item: AyahProgress }) => (
    <TouchableOpacity
      style={styles.ayahItem}
      onPress={() => {
        navigation.navigate('Memorize', {
          screen: 'Recite',
          params: { surahId, ayahId: item.ayahId },
        })
      }}
    >
      <View style={styles.ayahHeader}>
        <View style={styles.ayahNumberContainer}>
          <Text style={styles.ayahNumber}>{item.ayahId}</Text>
        </View>

        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.ayahDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Last Score:</Text>
          <Text
            style={[
              styles.detailValue,
              {
                color:
                  item.lastScore > 0
                    ? item.lastScore >= 80
                      ? '#4CAF50'
                      : item.lastScore >= 60
                      ? '#FFC107'
                      : '#F44336'
                    : '#999999',
              },
            ]}
          >
            {item.lastScore > 0 ? `${Math.round(item.lastScore)}%` : 'N/A'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Reviews:</Text>
          <Text style={styles.detailValue}>{item.reviewCount}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Last Reviewed:</Text>
          <Text style={styles.detailValue}>{formatDate(item.lastReview)}</Text>
        </View>

        {item.dateMemorized && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Memorized On:</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.dateMemorized)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.practiceButton}
          onPress={() => {
            navigation.navigate('Memorize', {
              screen: 'Recite',
              params: { surahId, ayahId: item.ayahId },
            })
          }}
        >
          <Ionicons name="play-circle-outline" size={16} color="white" />
          <Text style={styles.buttonText}>Practice</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading surah progress...</Text>
        </View>
      ) : (
        <>
          {/* Surah Header */}
          <View style={styles.surahHeader}>
            <View>
              <Text style={styles.surahName}>{surahDetails?.englishName}</Text>
              <Text style={styles.surahDetails}>
                {surahDetails?.revelationType} • {surahDetails?.numberOfAyahs}{' '}
                Ayahs
              </Text>
            </View>
            <Text style={styles.arabicName}>{surahDetails?.name}</Text>
          </View>

          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <Text style={styles.summaryTitle}>Memorization Progress</Text>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      (getStatusCounts().memorized /
                        (surahDetails?.numberOfAyahs || 1)) *
                      100
                    }%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.learningProgressBar,
                  {
                    width: `${
                      (getStatusCounts().learning /
                        (surahDetails?.numberOfAyahs || 1)) *
                      100
                    }%`,
                    left: `${
                      (getStatusCounts().memorized /
                        (surahDetails?.numberOfAyahs || 1)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>

            <View style={styles.statusCounts}>
              <View style={styles.statusCountItem}>
                <View
                  style={[styles.statusIndicator, styles.memorizedIndicator]}
                />
                <Text style={styles.statusCountText}>
                  <Text style={styles.statusCountValue}>
                    {getStatusCounts().memorized}
                  </Text>{' '}
                  Memorized
                </Text>
              </View>

              <View style={styles.statusCountItem}>
                <View
                  style={[styles.statusIndicator, styles.learningIndicator]}
                />
                <Text style={styles.statusCountText}>
                  <Text style={styles.statusCountValue}>
                    {getStatusCounts().learning}
                  </Text>{' '}
                  Learning
                </Text>
              </View>

              <View style={styles.statusCountItem}>
                <View style={[styles.statusIndicator, styles.newIndicator]} />
                <Text style={styles.statusCountText}>
                  <Text style={styles.statusCountValue}>
                    {getStatusCounts().new}
                  </Text>{' '}
                  New
                </Text>
              </View>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'all' && styles.activeFilterTab,
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'all' && styles.activeFilterText,
                ]}
              >
                All ({ayahProgress.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'memorized' && styles.activeFilterTab,
              ]}
              onPress={() => setFilter('memorized')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'memorized' && styles.activeFilterText,
                ]}
              >
                Memorized ({getStatusCounts().memorized})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'learning' && styles.activeFilterTab,
              ]}
              onPress={() => setFilter('learning')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'learning' && styles.activeFilterText,
                ]}
              >
                Learning ({getStatusCounts().learning})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'new' && styles.activeFilterTab,
              ]}
              onPress={() => setFilter('new')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'new' && styles.activeFilterText,
                ]}
              >
                New ({getStatusCounts().new})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ayah List */}
          <FlatList
            data={filteredAyahs()}
            renderItem={renderAyahItem}
            keyExtractor={(item) => item.ayahId.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No ayahs match the selected filter.
                </Text>
              </View>
            }
          />
        </>
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
  surahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  surahDetails: {
    fontSize: 14,
    color: '#666666',
  },
  arabicName: {
    fontSize: 24,
    color: '#2E8B57',
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
  },
  progressSummary: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#4CAF50', // Green for memorized
    position: 'absolute',
    left: 0,
    top: 0,
  },
  learningProgressBar: {
    height: 12,
    backgroundColor: '#FFC107', // Amber for learning
    position: 'absolute',
    top: 0,
  },
  statusCounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusCountItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  memorizedIndicator: {
    backgroundColor: '#4CAF50',
  },
  learningIndicator: {
    backgroundColor: '#FFC107',
  },
  newIndicator: {
    backgroundColor: '#F0F0F0',
  },
  statusCountText: {
    fontSize: 14,
    color: '#666666',
  },
  statusCountValue: {
    fontWeight: 'bold',
    color: '#333333',
  },
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: '#2E8B57',
  },
  filterText: {
    fontSize: 12,
    color: '#666666',
  },
  activeFilterText: {
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
  ayahItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ayahNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memorizedBadge: {
    backgroundColor: '#E8F5E9', // Light green
  },
  learningBadge: {
    backgroundColor: '#FFF8E1', // Light amber
  },
  newBadge: {
    backgroundColor: '#F5F5F5', // Light grey
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ayahDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E8B57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
})

export default SurahDetailScreen
