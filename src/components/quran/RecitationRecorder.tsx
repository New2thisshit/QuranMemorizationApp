// src/components/quran/RecitationRecorder.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { useRecitation } from '../../contexts/RecitationContext'

interface RecitationRecorderProps {
  onRecordingComplete?: (uri: string) => void
}

const RecitationRecorder: React.FC<RecitationRecorderProps> = ({
  onRecordingComplete,
}) => {
  const {
    isRecording,
    recordingUri,
    isProcessing,
    startRecording: contextStartRecording,
    stopRecording,
    processRecitation,
    playRecording,
    resetRecording,
  } = useRecitation()

  const [recordingDuration, setRecordingDuration] = useState(0)
  const [timer, setTimer] = useState<number | null>(null)

  // Start a timer when recording begins
  useEffect(() => {
    if (isRecording) {
      // Use window.setInterval to make it clear we're using the browser/RN version
      const interval = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
      setTimer(interval)
    } else if (timer) {
      // Clear the interval using window.clearInterval
      window.clearInterval(timer)
      setTimer(null)
    }

    return () => {
      if (timer) {
        window.clearInterval(timer)
      }
    }
  }, [isRecording])

  // Format seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Check and request permissions
  const checkAndRequestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'This app needs microphone access to record your recitation.',
          [{ text: 'OK' }],
        )
        return false
      }
      return true
    } catch (error) {
      console.error('Error requesting permissions:', error)
      return false
    }
  }

  // Handle starting the recording
  const handleStartRecording = async () => {
    const hasPermission = await checkAndRequestPermissions()
    if (!hasPermission) return

    setRecordingDuration(0)

    try {
      await contextStartRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      Alert.alert(
        'Recording Error',
        'Could not start recording. Please try again.',
      )
    }
  }

  const handleStopRecording = async () => {
    const uri = await stopRecording()
    if (uri && onRecordingComplete) {
      onRecordingComplete(uri)
    }
  }

  const handleProcessRecording = async () => {
    await processRecitation()
  }

  return (
    <View style={styles.container}>
      {/* Recording State */}
      <View style={styles.stateContainer}>
        {isRecording ? (
          <View style={styles.recordingStateContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingText}>
              Recording: {formatDuration(recordingDuration)}
            </Text>
          </View>
        ) : recordingUri ? (
          <Text style={styles.readyText}>Recording Ready</Text>
        ) : (
          <Text style={styles.instructionText}>Press Record to Begin</Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopRecording}
          >
            <Ionicons name="square" size={24} color="white" />
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        ) : recordingUri ? (
          <View style={styles.recordingButtonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.playButton]}
              onPress={playRecording}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.buttonText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.analyzeButton]}
              onPress={handleProcessRecording}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="analytics" size={24} color="white" />
              )}
              <Text style={styles.buttonText}>
                {isProcessing ? 'Analyzing...' : 'Analyze'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetRecording}
            >
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.recordButton]}
            onPress={handleStartRecording}
          >
            <Ionicons name="mic" size={24} color="white" />
            <Text style={styles.buttonText}>Record</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stateContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: 'red',
    fontWeight: '500',
  },
  readyText: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  recordingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  recordButton: {
    backgroundColor: '#2E8B57', // Islamic green
  },
  stopButton: {
    backgroundColor: '#F44336', // Red
  },
  playButton: {
    backgroundColor: '#2196F3', // Blue
  },
  analyzeButton: {
    backgroundColor: '#673AB7', // Deep Purple
  },
  resetButton: {
    backgroundColor: '#9E9E9E', // Grey
  },
})

export default RecitationRecorder
