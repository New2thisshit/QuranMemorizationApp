import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface TajweedIssue {
  rule: string
  description: string
  locations: string[]
}

interface TajweedFeedbackProps {
  score: number
  issues: TajweedIssue[]
}

const TajweedFeedback: React.FC<TajweedFeedbackProps> = ({ score, issues }) => {
  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50' // Green
    if (score >= 75) return '#8BC34A' // Light Green
    if (score >= 60) return '#FFC107' // Amber
    if (score >= 40) return '#FF9800' // Orange
    return '#F44336' // Red
  }

  // Function to get the appropriate icon for the score
  const getScoreIcon = (score: number) => {
    if (score >= 90) return 'checkmark-circle'
    if (score >= 75) return 'thumbs-up'
    if (score >= 60) return 'alert-circle'
    if (score >= 40) return 'warning'
    return 'close-circle'
  }

  // Function to get the verbal rating of the score
  const getScoreRating = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Acceptable'
    if (score >= 40) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <View style={styles.container}>
      {/* Score Section */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreTitle}>Tajweed Score</Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
            {Math.round(score)}%
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons
            name={getScoreIcon(score) as any}
            size={24}
            color={getScoreColor(score)}
          />
          <Text style={[styles.ratingText, { color: getScoreColor(score) }]}>
            {getScoreRating(score)}
          </Text>
        </View>
      </View>

      {/* Issues Section */}
      <View style={styles.issuesContainer}>
        <Text style={styles.issuesTitle}>Tajweed Issues ({issues.length})</Text>

        {issues.length === 0 ? (
          <Text style={styles.noIssuesText}>
            No tajweed issues detected. Excellent recitation!
          </Text>
        ) : (
          <ScrollView style={styles.issuesList}>
            {issues.map((issue, index) => (
              <View key={index} style={styles.issueItem}>
                <View style={styles.issueHeader}>
                  <Ionicons name="alert-circle" size={20} color="#FF9800" />
                  <Text style={styles.issueRule}>
                    {issue.rule.charAt(0).toUpperCase() + issue.rule.slice(1)}
                  </Text>
                </View>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                {issue.locations.length > 0 && (
                  <Text style={styles.issueLocations}>
                    Location: {issue.locations.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
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
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EEEEEE',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  issuesContainer: {
    flex: 1,
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  noIssuesText: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  issuesList: {
    maxHeight: 250,
  },
  issueItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueRule: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 4,
  },
  issueDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  issueLocations: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
})

export default TajweedFeedback
