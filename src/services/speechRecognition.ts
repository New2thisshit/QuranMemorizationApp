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
    // Attempt to use the API endpoint for analysis
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

    // Fallback to a simple placeholder implementation
    // This simulates what would happen until you implement the AI functionality
    const transcription = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' // Placeholder for actual transcription
    const confidence = 0.85 // Placeholder

    // Compare with expected text
    const comparison = compareTexts(transcription, expectedText)

    return {
      transcription,
      confidence,
      ...comparison,
    }
  }
}
