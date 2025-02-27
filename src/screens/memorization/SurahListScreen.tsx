import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

// Contexts
import { useQuran } from '../../contexts/QuranContext'

// Types
import { Surah } from '../../models/Surah'

const SurahListScreen: React.FC = () => {
  const navigation = useNavigation()
  const { surahs, isLoading, fetchSurahs } = useQuran()

  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([])

  // Filter surahs based on search query
  useEffect(() => {
    if (!surahs) return

    if (searchQuery.trim() === '') {
      setFilteredSurahs(surahs)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = surahs.filter(
        (surah) =>
          surah.englishName.toLowerCase().includes(query) ||
          surah.englishNameTranslation.toLowerCase().includes(query) ||
          surah.number.toString().includes(query),
      )
      setFilteredSurahs(filtered)
    }
  }, [searchQuery, surahs])

  // Fetch surahs on component mount if not already loaded
  useEffect(() => {
    if (surahs.length === 0 && !isLoading) {
      fetchSurahs()
    } else {
      setFilteredSurahs(surahs)
    }
  }, [])

  // Handle surah selection
  const handleSurahPress = (surah: Surah) => {
    navigation.navigate('AyahList', { surahId: surah.number })
  }

  // Render a single surah item
  const renderSurahItem = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={styles.surahItem}
      onPress={() => handleSurahPress(item)}
    >
      <View style={styles.surahNumberContainer}>
        <Text style={styles.surahNumber}>{item.number}</Text>
      </View>

      <View style={styles.surahInfo}>
        <Text style={styles.englishName}>{item.englishName}</Text>
        <Text style={styles.translation}>{item.englishNameTranslation}</Text>
        <Text style={styles.details}>
          {item.revelationType} • {item.numberOfAyahs} Ayahs
        </Text>
      </View>

      <View style={styles.arabicNameContainer}>
        <Text style={styles.arabicName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search surahs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Surahs List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading Surahs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={20}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                No surahs found matching "{searchQuery}"
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  surahItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  surahNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  surahNumber: {
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  surahInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  englishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  translation: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  details: {
    fontSize: 12,
    color: '#999999',
  },
  arabicNameContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  arabicName: {
    fontSize: 22,
    color: '#2E8B57',
    fontFamily: 'KFGQPC Uthmanic Script HAFS',
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
})

export default SurahListScreen
