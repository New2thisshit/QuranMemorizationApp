import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'

// Components
import AyahDisplay from '../../components/quran/AyahDisplay'
import RecitationRecorder from '../../components/quran/RecitationRecorder'
import TajweedFeedback from '../../components/quran/TajweedFeedback'
import AyahAudioPlayer from '../../components/quran/AyahAudioPlayer'

// Contexts
import { useQuran } from '../../contexts/QuranContext'
import { useRecitation } from '../../contexts/RecitationContext'

// Types
import { Ayah } from '../../models/Surah'

type ReciteScreenRouteProp = RouteProp<
  {
    Recite: { ayahId: number; surahId: number }
  },
  'Recite'
>

type ReciteScreenNavigationProp = StackNavigationProp<any, 'Recite'>

interface ReciteScreenProps {
  route: ReciteScreenRouteProp
  navigation: ReciteScreenNavigationProp
}

const ReciteScreen: React.FC<ReciteScreenProps> = ({ route, navigation }) => {
  const { ayahId, surahId } = route.params
  const {
    currentSurah,
    currentAyah,
    setSurah,
    setAyah,
    getNextAyah,
    getPreviousAyah,
  } = useQuran()

  const { feedback, isProcessing, resetRecording } = useRecitation()

  const [currentView, setCurrentView] = useState<'recite' | 'feedback'>(
    'recite',
  )

  // Load the surah and ayah on initial render
  useEffect(() => {
    const loadData = async () => {
      await setSurah(surahId)
      setAyah(ayahId)
    }

    loadData()

    // Reset the recording state when the component mounts
    resetRecording()
  }, [surahId, ayahId])

  // Update the navigation title when the surah changes
  useEffect(() => {
    if (currentSurah) {
      navigation.setOptions({
        title: `${currentSurah.englishName} (Ayah ${
          currentAyah?.numberInSurah || ''
        })`,
      })
    }
  }, [currentSurah, currentAyah, navigation])

  // Switch to feedback view when feedback is available
  useEffect(() => {
    if (feedback && !isProcessing) {
      setCurrentView('feedback')
    }
  }, [feedback, isProcessing])

  // Handle navigation to the next ayah
  const handleNextAyah = () => {
    const nextAyah = getNextAyah()
    if (nextAyah) {
      setAyah(nextAyah.numberInSurah)
      resetRecording()
      setCurrentView('recite')
    }
  }

  // Handle navigation to the previous ayah
  const handlePreviousAyah = () => {
    const prevAyah = getPreviousAyah()
    if (prevAyah) {
      setAyah(prevAyah.numberInSurah)
      resetRecording()
      setCurrentView('recite')
    }
  }

  if (!currentSurah || !currentAyah) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  // Create an array with previous, current, and next ayahs for display
  const getAyahsToDisplay = (): Ayah[] => {
    const ayahs: Ayah[] = []
    const currentIndex = currentSurah.ayahs.findIndex(
      (a) => a.number === currentAyah.number,
    )

    // Add previous ayah if available
    if (currentIndex > 0) {
      ayahs.push(currentSurah.ayahs[currentIndex - 1])
    }

    // Add current ayah
    ayahs.push(currentAyah)

    // Add next ayah if available
    if (currentIndex < currentSurah.ayahs.length - 1) {
      ayahs.push(currentSurah.ayahs[currentIndex + 1])
    }

    return ayahs
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {currentAyah && (
          <AyahAudioPlayer
            surahNumber={surahId}
            ayahNumber={currentAyah.numberInSurah}
          />
        )}

        {/* Ayah Display Section */}
        <View style={styles.ayahsContainer}>
          {getAyahsToDisplay().map((ayah) => (
            <AyahDisplay
              key={ayah.number}
              ayah={ayah}
              isCurrentAyah={ayah.number === currentAyah.number}
              showTranslation={true}
              fontSize={28}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              !getPreviousAyah() && styles.disabledButton,
            ]}
            onPress={handlePreviousAyah}
            disabled={!getPreviousAyah()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={getPreviousAyah() ? '#2E8B57' : '#CCCCCC'}
            />
            <Text
              style={[
                styles.navButtonText,
                !getPreviousAyah() && styles.disabledButtonText,
              ]}
            >
              Previous Ayah
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, !getNextAyah() && styles.disabledButton]}
            onPress={handleNextAyah}
            disabled={!getNextAyah()}
          >
            <Text
              style={[
                styles.navButtonText,
                !getNextAyah() && styles.disabledButtonText,
              ]}
            >
              Next Ayah
            </Text>
            <Ionicons
              name="arrow-forward"
              size={24}
              color={getNextAyah() ? '#2E8B57' : '#CCCCCC'}
            />
          </TouchableOpacity>
        </View>

        {/* View Toggle Buttons */}
        {feedback && (
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                currentView === 'recite' && styles.activeViewToggleButton,
              ]}
              onPress={() => setCurrentView('recite')}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  currentView === 'recite' && styles.activeViewToggleText,
                ]}
              >
                Record
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                currentView === 'feedback' && styles.activeViewToggleButton,
              ]}
              onPress={() => setCurrentView('feedback')}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  currentView === 'feedback' && styles.activeViewToggleText,
                ]}
              >
                Feedback
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recorder or Feedback Component */}
        <View style={styles.interactionContainer}>
          {currentView === 'recite' ? (
            <RecitationRecorder />
          ) : feedback ? (
            <View>
              {/* Words Analysis Section */}
              <View style={styles.wordsAnalysisContainer}>
                <Text style={styles.sectionTitle}>Recitation Analysis</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {feedback.correctWords.length}
                    </Text>
                    <Text style={styles.statLabel}>Correct Words</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.errorText]}>
                      {feedback.incorrectWords.length}
                    </Text>
                    <Text style={styles.statLabel}>Incorrect Words</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.warningText]}>
                      {feedback.missedWords.length}
                    </Text>
                    <Text style={styles.statLabel}>Missed Words</Text>
                  </View>
                </View>

                {feedback.incorrectWords.length > 0 && (
                  <View style={styles.errorWordsContainer}>
                    <Text style={styles.errorWordsTitle}>Incorrect Words:</Text>
                    <Text style={styles.errorWordsText}>
                      {feedback.incorrectWords.join(', ')}
                    </Text>
                  </View>
                )}

                {feedback.missedWords.length > 0 && (
                  <View style={styles.errorWordsContainer}>
                    <Text style={styles.errorWordsTitle}>Missed Words:</Text>
                    <Text style={styles.errorWordsText}>
                      {feedback.missedWords.join(', ')}
                    </Text>
                  </View>
                )}

                <View style={styles.overallScoreContainer}>
                  <Text style={styles.overallScoreTitle}>Overall Score:</Text>
                  <Text
                    style={[
                      styles.overallScoreValue,
                      {
                        color:
                          feedback.overallScore >= 70 ? '#4CAF50' : '#F44336',
                      },
                    ]}
                  >
                    {Math.round(feedback.overallScore)}%
                  </Text>
                </View>
              </View>

              {/* Tajweed Analysis Section */}
              <TajweedFeedback
                score={feedback.tajweedScore}
                issues={feedback.tajweedIssues}
              />

              {/* Try Again Button */}
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => {
                  resetRecording()
                  setCurrentView('recite')
                }}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahsContainer: {
    marginBottom: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: '#2E8B57',
    marginHorizontal: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#CCCCCC',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2E8B57',
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activeViewToggleButton: {
    backgroundColor: '#2E8B57',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E8B57',
  },
  activeViewToggleText: {
    color: 'white',
  },
  interactionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  wordsAnalysisContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  errorText: {
    color: '#F44336',
  },
  warningText: {
    color: '#FF9800',
  },
  errorWordsContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  errorWordsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  errorWordsText: {
    fontSize: 14,
    color: '#333333',
  },
  overallScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
  },
  overallScoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  overallScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E8B57',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
})

export default ReciteScreen
