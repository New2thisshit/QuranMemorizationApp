import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import the DisplayMode enum from MushafView
import { DisplayMode } from '../../components/quran/MushafView'

// Contexts
import { useAuth } from '../../contexts/AuthContext'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { AppTabParamList } from '../../types/navigation'

// Types
type UserSettings = {
  autoPlayRecitation: boolean
  showTranslation: boolean
  showTransliteration: boolean
  notificationsEnabled: boolean
  dailyReminderTime: string
  preferredReciter: string
  arabicFontSize: number
  // New Quran display settings
  quranDisplayMode: DisplayMode
  useMushafView: boolean
  showTajweedColors: boolean
  nightMode: boolean
  wordByWordTranslation: boolean
  translationFontSize: number
  transliterationFontSize: number
}

type Achievement = {
  id: string
  title: string
  description: string
  dateEarned: string
  icon: string
}

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth()
  const navigation = useNavigation<NavigationProp<AppTabParamList>>()

  const [showQuranSettings, setShowQuranSettings] = useState(false)

  const [settings, setSettings] = useState<UserSettings>({
    autoPlayRecitation: true,
    showTranslation: true,
    showTransliteration: false,
    notificationsEnabled: true,
    dailyReminderTime: '18:00',
    preferredReciter: 'Mishary Rashid Alafasy',
    arabicFontSize: 24,
    // Initialize new Quran display settings
    quranDisplayMode: DisplayMode.ARABIC_ONLY,
    useMushafView: true,
    showTajweedColors: true,
    nightMode: false,
    wordByWordTranslation: false,
    translationFontSize: 16,
    transliterationFontSize: 14,
  })

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true)

  // Load user settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings')
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()
    loadAchievements()
  }, [])

  // Save settings when they change
  const updateSetting = async (key: keyof UserSettings, value: any) => {
    try {
      const updatedSettings = { ...settings, [key]: value }
      setSettings(updatedSettings)

      // Save to your existing userSettings
      await AsyncStorage.setItem(
        'userSettings',
        JSON.stringify(updatedSettings),
      )

      // Also save individual settings to their dedicated keys for MushafView component
      switch (key) {
        case 'quranDisplayMode':
          await AsyncStorage.setItem('quran_display_mode', value)
          break
        case 'arabicFontSize':
          await AsyncStorage.setItem('quran_font_size', value.toString())
          break
        case 'translationFontSize':
          await AsyncStorage.setItem('translation_font_size', value.toString())
          break
        case 'transliterationFontSize':
          await AsyncStorage.setItem(
            'transliteration_font_size',
            value.toString(),
          )
          break
        case 'useMushafView':
          await AsyncStorage.setItem('use_mushaf_mode', value.toString())
          break
        case 'showTajweedColors':
          await AsyncStorage.setItem('show_tajweed_colors', value.toString())
          break
        case 'nightMode':
          await AsyncStorage.setItem('night_mode', value.toString())
          break
        case 'autoPlayRecitation':
          await AsyncStorage.setItem('auto_play_recitation', value.toString())
          break
        case 'preferredReciter':
          await AsyncStorage.setItem('preferred_reciter', value)
          break
        case 'wordByWordTranslation':
          await AsyncStorage.setItem(
            'word_by_word_translation',
            value.toString(),
          )
          break
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Load user achievements
  const loadAchievements = async () => {
    setIsLoadingAchievements(true)

    try {
      // In a real app, this would come from an API
      // Simulating an API call with a timeout
      setTimeout(() => {
        const mockAchievements: Achievement[] = [
          {
            id: 'first_surah',
            title: 'First Surah Completed',
            description: 'Memorized an entire surah for the first time',
            dateEarned: '2023-05-15',
            icon: 'checkmark-circle',
          },
          {
            id: 'seven_day_streak',
            title: '7-Day Streak',
            description: 'Practiced memorization for 7 consecutive days',
            dateEarned: '2023-05-20',
            icon: 'flame',
          },
          {
            id: 'juz_amma',
            title: 'Juz Amma Explorer',
            description: 'Started memorizing 5 surahs from Juz Amma',
            dateEarned: '2023-06-01',
            icon: 'star',
          },
        ]

        setAchievements(mockAchievements)
        setIsLoadingAchievements(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load achievements:', error)
      setIsLoadingAchievements(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout()
          } catch (error) {
            console.error('Logout failed:', error)
          }
        },
        style: 'destructive',
      },
    ])
  }

  // Format a date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  // Navigate to Quran Mushaf View
  const goToMushafView = () => {
    // Navigate to the Quran view screen with default surah 1
    navigation.navigate('QuranView', { surahId: 1 })
  }

  // Show the Quran settings modal or navigate to settings page
  const showQuranDisplaySettings = () => {
    // If you want to use a modal:
    // setShowQuranSettings(true)

    // If you want to use a separate screen:
    navigation.navigate('QuranSettings')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* User Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../../../assets/images/default-avatar.png')}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>
            {user?.email || 'email@example.com'}
          </Text>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>

          {isLoadingAchievements ? (
            <ActivityIndicator size="small" color="#2E8B57" />
          ) : achievements.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="trophy-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                No achievements yet. Keep memorizing to earn badges!
              </Text>
            </View>
          ) : (
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIconContainer}>
                    <Ionicons
                      name={achievement.icon as any}
                      size={24}
                      color="#2E8B57"
                    />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                    <Text style={styles.achievementDate}>
                      Earned on {formatDate(achievement.dateEarned)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          {/* Add a Quran Mushaf View button */}
          <TouchableOpacity
            style={styles.settingItemButton}
            onPress={goToMushafView}
          >
            <Text style={styles.settingLabel}>Quran Mushaf View</Text>
            <Ionicons name="book-outline" size={20} color="#2E8B57" />
          </TouchableOpacity>

          {/* Add Quran Display Settings button */}
          <TouchableOpacity
            style={styles.settingItemButton}
            onPress={showQuranDisplaySettings}
          >
            <Text style={styles.settingLabel}>Quran Display Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Show Translation</Text>
            <Switch
              value={settings.showTranslation}
              onValueChange={(value) => updateSetting('showTranslation', value)}
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Show Transliteration</Text>
            <Switch
              value={settings.showTransliteration}
              onValueChange={(value) =>
                updateSetting('showTransliteration', value)
              }
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto-Play Recitation</Text>
            <Switch
              value={settings.autoPlayRecitation}
              onValueChange={(value) =>
                updateSetting('autoPlayRecitation', value)
              }
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) =>
                updateSetting('notificationsEnabled', value)
              }
              trackColor={{ false: '#CCCCCC', true: '#2E8B57' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Preferred Reciter</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>
                {settings.preferredReciter}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Daily Reminder Time</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>
                {settings.dailyReminderTime}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Arabic Font Size</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{settings.arabicFontSize}</Text>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItemButton}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>App Version: 1.0.0</Text>
          </View>
        </View>

        {/* Quran Settings Modal (optional) */}
        {/* If you prefer a modal approach instead of a separate screen */}
        {/* 
      <Modal
        visible={showQuranSettings}
        animationType="slide"
        onRequestClose={() => setShowQuranSettings(false)}
      >
        <QuranSettingsContent 
          settings={settings}
          updateSetting={updateSetting}
          onClose={() => setShowQuranSettings(false)}
        />
      </Modal>
      */}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    marginTop: 8,
    color: '#999999',
    textAlign: 'center',
  },
  achievementsContainer: {
    marginTop: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemButton: {
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
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#F44336',
    fontWeight: '500',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#999999',
  },
})

export default ProfileScreen
