// src/components/common/OfflineNotice.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuran } from '../../contexts/QuranContext'

const OfflineNotice: React.FC = () => {
  const { isOnline } = useQuran()

  if (isOnline) {
    return null
  }

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text style={styles.text}>
        You're offline. Some features may be limited.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F44336',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
})

export default OfflineNotice
