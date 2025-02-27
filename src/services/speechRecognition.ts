import * as tf from '@tensorflow/tfjs'
import { fetch } from '@tensorflow/tfjs-react-native'
import * as FileSystem from 'expo-file-system'
import * as recitationApi from '../api/recitation'

// Interface for speech recognition results
interface SpeechRecognitionResult {
  transcription: string
  confidence: number
  correctWords: string[]
  incorrectWords: string[]
  missedWords: string[]
  accuracy: number
}

// Load the TensorFlow model for speech recognition
let model: tf.LayersModel | null = null

const loadModel = async () => {
  if (model) return model

  try {
    // In a real app, you would load a pre-trained model from your server or from TF Hub
    // For this example, we'll assume you have a model file in the assets folder or stored in app storage

    // Check if model is available in local storage
    const modelDir = `${FileSystem.documentDirectory}models/speech_recognition/`
    const modelInfoPath = `${modelDir}model.json`

    const modelInfo = await FileSystem.getInfoAsync(modelInfoPath)

    if (modelInfo.exists) {
      // Load model from local storage
      model = await tf.loadLayersModel(`file://${modelInfoPath}`)
    } else {
      // If not in local storage, download from server
      const serverModelUrl =
        'https://yourquranapp.com/models/speech_recognition/model.json'

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(modelDir)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true })
      }

      // Download model files (simplified, in real app would need to download all model shards)
      await FileSystem.downloadAsync(serverModelUrl, modelInfoPath)

      // Load the model
      model = await tf.loadLayersModel(`file://${modelInfoPath}`)
    }

    return model
  } catch (error) {
    console.error('Error loading speech recognition model:', error)
    throw error
  }
}

// Process the audio and convert to a format that TensorFlow can use
const preprocessAudio = async (audioUri: string) => {
  try {
    // In a real application, this would involve:
    // 1. Converting the audio to the right format (e.g., WAV)
    // 2. Sampling at the right rate
    // 3. Extracting MFCC or other audio features
    // 4. Normalizing the data

    // For simplicity, we'll just use some placeholder code here
    const audioData = new Float32Array(1000) // Placeholder for actual audio processing

    return tf.tensor(audioData).expandDims(0) // Add batch dimension
  } catch (error) {
    console.error('Error preprocessing audio:', error)
    throw error
  }
}

// Compare the transcription with the expected text
const compareTexts = (transcription: string, expectedText: string) => {
  // Split texts into words
  const transcribedWords = transcription.trim().split(/\s+/)
  const expectedWords = expectedText.trim().split(/\s+/)

  const correctWords: string[] = []
  const incorrectWords: string[] = []
  const missedWords: string[] = []

  // Find correct and incorrect words
  for (let i = 0; i < transcribedWords.length; i++) {
    if (i < expectedWords.length) {
      if (
        transcribedWords[i].toLowerCase() === expectedWords[i].toLowerCase()
      ) {
        correctWords.push(transcribedWords[i])
      } else {
        incorrectWords.push(transcribedWords[i])
      }
    } else {
      // Extra words in transcription
      incorrectWords.push(transcribedWords[i])
    }
  }

  // Find missed words
  if (expectedWords.length > transcribedWords.length) {
    for (let i = transcribedWords.length; i < expectedWords.length; i++) {
      missedWords.push(expectedWords[i])
    }
  }

  // Calculate accuracy
  const accuracy = (correctWords.length / expectedWords.length) * 100

  return {
    correctWords,
    incorrectWords,
    missedWords,
    accuracy,
  }
}

// Main function to analyze a recitation
export const analyzeRecitation = async (
  audioUri: string,
  expectedText: string,
): Promise<SpeechRecognitionResult> => {
  try {
    // In a production app, we might use both on-device and server-side processing
    // For simplicity and better accuracy, we'll use the API endpoint
    const response = await recitationApi.analyzeRecitation(
      audioUri,
      expectedText,
    )

    // If the API call succeeds, return the results
    return {
      transcription: response.transcription,
      confidence: response.confidence,
      correctWords: response.correctWords,
      incorrectWords: response.incorrectWords,
      missedWords: response.missedWords,
      accuracy: response.accuracy,
    }
  } catch (error) {
    console.error('Error using API for speech recognition:', error)

    // Fallback to on-device processing if API call fails
    try {
      await loadModel()

      if (!model) {
        throw new Error('Failed to load speech recognition model')
      }

      // Preprocess the audio
      const processedAudio = await preprocessAudio(audioUri)

      // Run inference
      const prediction = model.predict(processedAudio) as tf.Tensor

      // Process the prediction to get a transcription (simplified)
      // In a real app, this would be more complex
      const logits = await prediction.array()

      // Convert logits to text (very simplified)
      const transcription = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' // Placeholder for actual transcription
      const confidence = 0.85 // Placeholder

      // Compare with expected text
      const comparison = compareTexts(transcription, expectedText)

      // Clean up tensor
      prediction.dispose()
      processedAudio.dispose()

      return {
        transcription,
        confidence,
        ...comparison,
      }
    } catch (fallbackError) {
      console.error('Fallback speech recognition failed:', fallbackError)
      throw fallbackError
    }
  }
}
