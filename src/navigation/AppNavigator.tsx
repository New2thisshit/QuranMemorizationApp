import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

// Import screens
import HomeScreen from '../screens/home/HomeScreen'
import MemorizationNavigator from './MemorizationNavigator'
import ProgressNavigator from './ProgressNavigator'
import ProfileScreen from '../screens/home/ProfileScreen'

// Define app tab param list
export type AppTabParamList = {
  Home: undefined
  Memorize: undefined
  Progress: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<AppTabParamList>()

const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Memorize') {
            iconName = focused ? 'book' : 'book-outline'
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          } else {
            iconName = 'help-circle-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#2E8B57', // Green color for Islamic theme
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Memorize"
        component={MemorizationNavigator}
        options={{ title: 'Memorize' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressNavigator}
        options={{ title: 'Progress' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

export default AppNavigator
