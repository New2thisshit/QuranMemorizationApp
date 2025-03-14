import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useEnhancedQuran } from '../../contexts/EnhancedQuranContext'
import {
  ResourceMetadata,
  ContentStatus,
  ResourceType,
  DataPreferences,
} from '../../models/QuranDataTypes'
import ProgressBar from '@react-native-community/progress-bar-android'
import ProgressView from '@react-native-community/progress-view'
import * as Progress from 'react-native-progress'

/**
 * ResourceManagerScreen allows users to manage downloadable resources like
 * translations, recitations, and tafsirs for offline use.
 */
const ResourceManagerScreen: React.FC = () => {
  const {
    availableResources,
    downloadResource,
    deleteResource,
    getResourceProgress,
    isResourceAvailable,
    getStorageUsage,
    clearAllData,
    dataPreferences,
    updateDataPreferences,
    isOnline,
  } = useEnhancedQuran()

  const [storageUsed, setStorageUsed] = useState<string>('Calculating...')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<ResourceType>(
    ResourceType.TRANSLATION,
  )
  const [filteredResources, setFilteredResources] = useState<
    ResourceMetadata[]
  >([])

  // Load storage usage and update filtered resources on mount
  useEffect(() => {
    updateStorageUsage()
    updateFilteredResources()
  }, [availableResources, selectedTab])

  // Update storage usage display
  const updateStorageUsage = async () => {
    try {
      const bytes = await getStorageUsage()
      // Format bytes to human-readable size
      setStorageUsed(formatBytes(bytes))
    } catch (error) {
      console.error('Error getting storage usage:', error)
      setStorageUsed('Unknown')
    }
  }

  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Update filtered resources based on selected tab
  const updateFilteredResources = () => {
    const filtered = availableResources.filter(
      (resource) => resource.type === selectedTab,
    )
    setFilteredResources(filtered)
  }

  // Handle resource download/delete
  const handleResourceAction = async (resource: ResourceMetadata) => {
    try {
      setIsLoading(true)

      if (resource.status === ContentStatus.AVAILABLE) {
        // Confirm deletion
        Alert.alert(
          'Delete Resource',
          `Are you sure you want to delete "${resource.name}"? You'll need to download it again to use it offline.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                const success = await deleteResource(resource.id)
                if (success) {
                  updateStorageUsage()
                } else {
                  Alert.alert('Error', 'Failed to delete resource.')
                }
              },
            },
          ],
        )
      } else if (resource.status === ContentStatus.NOT_AVAILABLE) {
        // Start download if online
        if (!isOnline) {
          Alert.alert(
            'No Internet Connection',
            'You need an internet connection to download resources.',
            [{ text: 'OK' }],
          )
          return
        }

        // If download only on WiFi is enabled, check connection type
        if (dataPreferences.downloadOnWifiOnly) {
          // The actual check is handled in the downloadResource function
        }

        const success = await downloadResource(resource.id)
        if (!success) {
          Alert.alert('Download Failed', 'Failed to download resource.')
        }
        updateStorageUsage()
      }
    } catch (error) {
      console.error('Resource action error:', error)
      Alert.alert('Error', 'An error occurred while managing resources.')
    } finally {
      setIsLoading(false)
    }
  }

  // Clear all downloaded data
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all downloaded resources and cached data. You will need to download everything again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true)
            try {
              const success = await clearAllData()
              if (success) {
                updateStorageUsage()
                Alert.alert('Success', 'All data has been cleared.')
              } else {
                Alert.alert('Error', 'Failed to clear data.')
              }
            } catch (error) {
              console.error('Clear data error:', error)
              Alert.alert('Error', 'An error occurred while clearing data.')
            } finally {
              setIsLoading(false)
            }
          },
        },
      ],
    )
  }

  // Update data preferences
  const handlePreferenceToggle = (
    key: keyof DataPreferences,
    value: boolean,
  ) => {
    updateDataPreferences({ [key]: value })
  }

  // Get icon for resource type
  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.TRANSLATION:
        return 'language-outline'
      case ResourceType.RECITATION:
        return 'mic-outline'
      case ResourceType.TAFSIR:
        return 'book-outline'
      default:
        return 'document-outline'
    }
  }

  // Get icon for resource status
  const getStatusIcon = (status: ContentStatus) => {
    switch (status) {
      case ContentStatus.AVAILABLE:
        return 'checkmark-circle'
      case ContentStatus.DOWNLOADING:
        return 'cloud-download-outline'
      case ContentStatus.ERROR:
        return 'alert-circle-outline'
      default:
        return 'cloud-outline'
    }
  }

  // Get color for resource status
  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case ContentStatus.AVAILABLE:
        return '#4CAF50' // Green
      case ContentStatus.DOWNLOADING:
        return '#2196F3' // Blue
      case ContentStatus.ERROR:
        return '#F44336' // Red
      default:
        return '#757575' // Gray
    }
  }

  // Get resource size as human-readable string
  const getResourceSizeText = (resource: ResourceMetadata) => {
    if (!resource.size) return 'Unknown size'
    return formatBytes(resource.size)
  }

  // Get action button text based on resource status
  const getActionButtonText = (status: ContentStatus) => {
    switch (status) {
      case ContentStatus.AVAILABLE:
        return 'Delete'
      case ContentStatus.DOWNLOADING:
        return 'Downloading...'
      case ContentStatus.ERROR:
        return 'Retry'
      default:
        return 'Download'
    }
  }

  // Render a resource item in the list
  const renderResourceItem = ({ item }: { item: ResourceMetadata }) => {
    const progress = getResourceProgress(item.id)
    const isDownloading = item.status === ContentStatus.DOWNLOADING

    return (
      <View style={styles.resourceItem}>
        <View style={styles.resourceInfo}>
          <View style={styles.resourceHeader}>
            <Ionicons
              name={getResourceTypeIcon(item.type) as any}
              size={24}
              color="#2E8B57"
              style={styles.resourceIcon}
            />
            <View>
              <Text style={styles.resourceName}>{item.name}</Text>
              <Text style={styles.resourceLanguage}>
                {item.language.toUpperCase()} • {item.author || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.resourceDetails}>
            <View style={styles.resourceStatus}>
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={16}
                color={getStatusColor(item.status)}
              />
              <Text
                style={[
                  styles.resourceStatusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status === ContentStatus.AVAILABLE
                  ? 'Downloaded'
                  : 'Not Downloaded'}
              </Text>
            </View>
            <Text style={styles.resourceSize}>{getResourceSizeText(item)}</Text>
          </View>

          {isDownloading && (
            <View style={styles.progressContainer}>
              <Progress.Bar
                progress={progress / 100}
                width={null}
                height={4}
                color="#2E8B57"
                style={[styles.progressBar, { flex: 1 }]}
              />
              <Text style={styles.progressText}>{`${Math.round(
                progress,
              )}%`}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            item.status === ContentStatus.AVAILABLE && styles.deleteButton,
            isDownloading && styles.disabledButton,
          ]}
          onPress={() => handleResourceAction(item)}
          disabled={isDownloading}
        >
          <Text style={styles.actionButtonText}>
            {getActionButtonText(item.status)}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Storage Info */}
      <View style={styles.storageContainer}>
        <View style={styles.storageInfo}>
          <Text style={styles.storageTitle}>Storage Used</Text>
          <Text style={styles.storageValue}>{storageUsed}</Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAllData}
          disabled={isLoading}
        >
          <Text style={styles.clearButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Download Settings</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Download on WiFi Only</Text>
          <Switch
            value={dataPreferences.downloadOnWifiOnly}
            onValueChange={(value) =>
              handlePreferenceToggle('downloadOnWifiOnly', value)
            }
            trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
            thumbColor="#FFFFFF"
            disabled={isLoading}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-Download Favorites</Text>
          <Switch
            value={dataPreferences.autoDownloadFavorites}
            onValueChange={(value) =>
              handlePreferenceToggle('autoDownloadFavorites', value)
            }
            trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
            thumbColor="#FFFFFF"
            disabled={isLoading}
          />
        </View>
      </View>

      {/* Resource Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === ResourceType.TRANSLATION && styles.activeTab,
          ]}
          onPress={() => setSelectedTab(ResourceType.TRANSLATION)}
        >
          <Ionicons
            name="language-outline"
            size={20}
            color={
              selectedTab === ResourceType.TRANSLATION ? '#2E8B57' : '#757575'
            }
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === ResourceType.TRANSLATION && styles.activeTabText,
            ]}
          >
            Translations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === ResourceType.RECITATION && styles.activeTab,
          ]}
          onPress={() => setSelectedTab(ResourceType.RECITATION)}
        >
          <Ionicons
            name="mic-outline"
            size={20}
            color={
              selectedTab === ResourceType.RECITATION ? '#2E8B57' : '#757575'
            }
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === ResourceType.RECITATION && styles.activeTabText,
            ]}
          >
            Recitations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === ResourceType.TAFSIR && styles.activeTab,
          ]}
          onPress={() => setSelectedTab(ResourceType.TAFSIR)}
        >
          <Ionicons
            name="book-outline"
            size={20}
            color={selectedTab === ResourceType.TAFSIR ? '#2E8B57' : '#757575'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === ResourceType.TAFSIR && styles.activeTabText,
            ]}
          >
            Tafsirs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resource List */}
      {isLoading && filteredResources.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      ) : filteredResources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={getResourceTypeIcon(selectedTab) as any}
            size={48}
            color="#CCCCCC"
          />
          <Text style={styles.emptyText}>No {selectedTab}s available</Text>
          {!isOnline && (
            <Text style={styles.offlineText}>
              You're offline. Connect to the internet to see more resources.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          renderItem={renderResourceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  storageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  storageInfo: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 14,
    color: '#666666',
  },
  storageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  clearButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  settingsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2E8B57',
  },
  tabText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#757575',
  },
  activeTabText: {
    color: '#2E8B57',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  offlineText: {
    marginTop: 8,
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceIcon: {
    marginRight: 12,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  resourceLanguage: {
    fontSize: 12,
    color: '#666666',
  },
  resourceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resourceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  resourceSize: {
    fontSize: 12,
    color: '#999999',
  },
  progressContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    color: '#666666',
    minWidth: 40,
    textAlign: 'right',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#2E8B57',
    minWidth: 90,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
})
