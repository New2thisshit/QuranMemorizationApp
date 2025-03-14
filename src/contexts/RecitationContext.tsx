import React, { createContext, useState, useContext } from 'react'
import { Audio } from 'expo-av'
import * as recitationApi from '../api/recitation'
import { useQuran } from './QuranContext'
import { analyzeRecitation } from '../services/speechRecognition'
import { analyzeTajweed } from '../services/tajweedAnalysis'

type RecitationFeedback = {
  correctWords: string[]
  incorrectWords: string[]
  missedWords: string[]
  tajweedScore: number
  tajweedIssues: {
    rule: string
    description: string
    locations: string[]
  }[]
  overallScore: number
}

type RecitationContextType = {
  isRecording: boolean
  recordingUri: string | null
  isProcessing: boolean
  feedback: RecitationFeedback | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null> // Updated return type
  processRecitation: () => Promise<RecitationFeedback | undefined> // Updated return type
  resetRecording: () => void
  saveRecitationProgress: (ayahId: string, score: number) => Promise<void>
  playRecording: () => Promise<void>
}

const RecitationContext = createContext<RecitationContextType | undefined>(
  undefined,
)

export const RecitationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentSurah, currentAyah } = useQuran()
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [recordingUri, setRecordingUri] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState<RecitationFeedback | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  const startRecording = async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) {
        throw new Error('Audio recording permission not granted')
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })

      // Create and start recording
      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      )
      setRecording(newRecording)
      setIsRecording(true)
      await newRecording.startAsync()
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error // Re-throw to be handled by the component
    }
  }

  const stopRecording = async (): Promise<string | null> => {
    if (!recording) return null

    try {
      setIsRecording(false)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecordingUri(uri)
      setRecording(null)

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      })

      return uri || null
    } catch (error) {
      console.error('Failed to stop recording:', error)
      return null
    }
  }

  const processRecitation = async () => {
    if (!recordingUri || !currentAyah) return

    try {
      setIsProcessing(true)

      // Get the correct text for the current ayah
      const correctText = currentAyah.text

      // Analyze the speech to detect words and mistakes
      const speechAnalysis = await analyzeRecitation(recordingUri, correctText)

      // Analyze tajweed quality
      const tajweedAnalysis = await analyzeTajweed(recordingUri)

      // Combine analyses into comprehensive feedback
      const recitationFeedback: RecitationFeedback = {
        correctWords: speechAnalysis.correctWords,
        incorrectWords: speechAnalysis.incorrectWords,
        missedWords: speechAnalysis.missedWords,
        tajweedScore: tajweedAnalysis.score,
        tajweedIssues: tajweedAnalysis.issues,
        overallScore:
          speechAnalysis.accuracy * 0.7 + tajweedAnalysis.score * 0.3,
      }

      setFeedback(recitationFeedback)

      // Save the progress if the score is good enough (e.g., > 70%)
      if (recitationFeedback.overallScore > 70 && currentAyah.id) {
        await saveRecitationProgress(
          currentAyah.id,
          recitationFeedback.overallScore,
        )
      }

      return recitationFeedback
    } catch (error) {
      console.error('Failed to process recitation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const saveRecitationProgress = async (ayahId: string, score: number) => {
    try {
      await recitationApi.saveProgress({
        ayahId,
        score,
        timestamp: new Date().toISOString(),
        recordingUri: recordingUri || '',
      })
    } catch (error) {
      console.error('Failed to save recitation progress:', error)
    }
  }

  const playRecording = async () => {
    if (!recordingUri) return

    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync()
      }

      // Load and play the recorded audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
      )

      setSound(newSound)

      // Clean up when playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync()
        }
      })
    } catch (error) {
      console.error('Failed to play recording:', error)
    }
  }

  const resetRecording = () => {
    setRecordingUri(null)
    setFeedback(null)
  }

  return (
    <RecitationContext.Provider
      value={{
        isRecording,
        recordingUri,
        isProcessing,
        feedback,
        startRecording,
        stopRecording,
        processRecitation,
        resetRecording,
        saveRecitationProgress,
        playRecording,
      }}
    >
      {children}
    </RecitationContext.Provider>
  )
}

export const useRecitation = () => {
  const context = useContext(RecitationContext)
  if (context === undefined) {
    throw new Error('useRecitation must be used within a RecitationProvider')
  }
  return context
}
