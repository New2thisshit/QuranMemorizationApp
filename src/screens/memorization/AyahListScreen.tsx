import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'

// Components
import AyahDisplay from '../../components/quran/AyahDisplay'

// Contexts
import { useQuran } from '../../contexts/QuranContext'

// API
import * as recitationApi from '../../api/recitation'

// Types
import { Ayah } from '../../models/Surah'

type AyahProgress = {
  ayahId: number
  lastScore: number
  dateMemorized: string | null
  reviewCount: number
}

type AyahListScreenRouteProp = RouteProp<
  {
    AyahList: { surahId: number }
  },
  'AyahList'
>

type AyahListScreenNavigationProp = StackNavigationProp<any, 'AyahList'>

interface AyahListScreenProps {
  route: AyahListScreenRouteProp
  navigation: AyahListScreenNavigationProp
}

const AyahListScreen: React.FC<AyahListScreenProps> = ({
  route,
  navigation,
}) => {
  const { surahId } = route.params
  const { currentSurah, setSurah, isLoading } = useQuran()

  const [ayahProgress, setAyahProgress] = useState<
    Record<number, AyahProgress>
  >({})
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)

  // Load the surah data on component mount
  useEffect(() => {
    const loadData = async () => {
      await setSurah(surahId)
      await loadAyahProgress()
    }

    loadData()
  }, [surahId])

  // Update the navigation title when the surah is loaded
  useEffect(() => {
    if (currentSurah) {
      navigation.setOptions({
        title: `${currentSurah.englishName}`,
      })
    }
  }, [currentSurah, navigation])

  // Load the user's progress for this surah
  const loadAyahProgress = async () => {
    setIsLoadingProgress(true)
    try {
      const progress = await recitationApi.getSurahProgress(surahId)

      // Transform the data into a format that's easy to use in the UI
      const progressMap: Record<number, AyahProgress> = {}

      progress.ayahsProgress.forEach((item: any) => {
        progressMap[item.ayahId] = {
          ayahId: item.ayahId,
          lastScore: item.lastScore,
          dateMemorized: item.dateMemorized,
          reviewCount: item.reviewCount,
        }
      })

      setAyahProgress(progressMap)
    } catch (error) {
      console.error('Failed to load ayah progress:', error)
    } finally {
      setIsLoadingProgress(false)
    }
  }

  // Handle ayah selection for recitation and memoize it
  const handleAyahPress = useCallback(
    (ayah: Ayah) => {
      navigation.navigate('QuranView', {
        surahId: surahId,
        ayahId: ayah.numberInSurah,
      })
    },
    [navigation, surahId],
  )

  // Get the memorization status icon for an ayah
  const getStatusIcon = (ayah: Ayah) => {
    const progress = ayahProgress[ayah.numberInSurah]

    if (!progress) {
      return <Ionicons name="ellipse-outline" size={18} color="#CCCCCC" />
    }

    if (progress.dateMemorized) {
      return <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
    }

    if (progress.lastScore >= 80) {
      return <Ionicons name="checkbox-outline" size={18} color="#8BC34A" />
    }

    if (progress.reviewCount > 0) {
      return <Ionicons name="time-outline" size={18} color="#FFC107" />
    }

    return <Ionicons name="ellipse-outline" size={18} color="#CCCCCC" />
  }

  // Render a single ayah item
  const renderAyahItem = useCallback(
    ({ item }: { item: Ayah }) => {
      const progress = ayahProgress[item.numberInSurah]

      return (
        <TouchableOpacity
          style={styles.ayahItemContainer}
          onPress={() => handleAyahPress(item)}
        >
          <View style={styles.ayahStatusContainer}>
            {getStatusIcon(item)}
            {progress && (
              <Text style={styles.ayahScore}>
                {progress.lastScore ? `${Math.round(progress.lastScore)}%` : ''}
              </Text>
            )}
          </View>

          <View style={styles.ayahContentContainer}>
            <AyahDisplay ayah={item} showTranslation={true} fontSize={20} />
          </View>

          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>
      )
    },
    [ayahProgress, getStatusIcon, handleAyahPress],
  )

  // Create a stable keyExtractor
  const keyExtractor = useCallback((item: Ayah) => item.number.toString(), [])

  // Show juz information if available
  const renderJuzInfo = (juzNumber: number) => (
    <View style={styles.juzContainer}>
      <View style={styles.juzBadge}>
        <Text style={styles.juzText}>Juz {juzNumber}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading Ayahs...</Text>
        </View>
      ) : currentSurah ? (
        <View style={styles.contentContainer}>
          {/* Surah Header */}
          <View style={styles.surahHeaderContainer}>
            <View style={styles.surahInfoContainer}>
              <Text style={styles.surahName}>{currentSurah.englishName}</Text>
              <Text style={styles.surahTranslation}>
                {currentSurah.englishNameTranslation}
              </Text>
              <Text style={styles.surahDetails}>
                {currentSurah.revelationType} • {currentSurah.numberOfAyahs}{' '}
                Ayahs
              </Text>
            </View>
            <Text style={styles.arabicName}>{currentSurah.name}</Text>
          </View>

          {/* Bismillah (except for Surah At-Tawbah) */}
          {currentSurah.number !== 9 && (
            <View style={styles.bismillahContainer}>
              <Text style={styles.bismillahText}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
            </View>
          )}

          {/* Progress Summary */}
          <View style={styles.progressSummaryContainer}>
            <Text style={styles.progressTitle}>Memorization Progress</Text>

            {isLoadingProgress ? (
              <ActivityIndicator size="small" color="#2E8B57" />
            ) : (
              <View style={styles.progressStatsContainer}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          (Object.keys(ayahProgress).length /
                            currentSurah.numberOfAyahs) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Object.keys(ayahProgress).length} of{' '}
                  {currentSurah.numberOfAyahs} Ayahs Started
                </Text>
              </View>
            )}
          </View>

          {/* Ayahs List */}
          <FlatList
            data={currentSurah.ayahs}
            renderItem={renderAyahItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            maxToRenderPerBatch={5} // Reduce batch size
            windowSize={3} // Reduce window size
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50} // Add delay between batch processing
          />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load surah data.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setSurah(surahId)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  contentContainer: {
    flex: 1,
  },
  surahHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  surahInfoContainer: {
    flex: 1,
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  surahTranslation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  surahDetails: {
    fontSize: 12,
    color: '#999999',
  },
  arabicName: {
    fontSize: 28,
    color: '#2E8B57',
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
    marginLeft: 16,
  },
  bismillahContainer: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  bismillahText: {
    fontSize: 24,
    color: '#2E8B57',
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
  },
  progressSummaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  progressStatsContainer: {
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2E8B57',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
  },
  listContent: {
    padding: 16,
  },
  ayahItemContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 12,
  },
  ayahStatusContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  ayahScore: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  ayahContentContainer: {
    flex: 1,
    marginRight: 8,
  },
  juzContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
  },
  juzBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E8B57',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  juzText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#2E8B57',
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
})

export default React.memo(AyahListScreen)
