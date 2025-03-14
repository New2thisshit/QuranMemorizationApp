import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'
import {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs'
import {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native'

// src/types/navigation.ts
export type RootStackParamList = {
  Auth: undefined
  App: NavigatorScreenParams<AppTabParamList>
  Home: undefined
  SurahList: undefined
  SurahDetail: { surahId: number }
  AyahList: { surahId: number }
}

// Updated to change Auth to AuthMain
export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  AuthMain: undefined // Changed from Auth to AuthMain
  ForgotPassword: { email: string }
  OTPVerification: { email: string; mode: 'register' | 'password-reset' }
  ResetPassword: { email: string; code: string }
}

export type AppTabParamList = {
  Home: undefined
  Memorize: NavigatorScreenParams<MemorizationStackParamList>
  Progress: NavigatorScreenParams<ProgressStackParamList>
  Profile: undefined
  QuranView: { surahId: number; ayahId?: number }
  QuranSettings: undefined
}

export type MemorizationStackParamList = {
  MemorizationMain: undefined
  SurahList: undefined
  AyahList: { surahId: number }
  Recite: { ayahId: number; surahId: number }
  QuranView: { surahId: number; ayahId?: number }
  QuranSettings: undefined
}

export type ProgressStackParamList = {
  ProgressMain: undefined
  Stats: undefined
  RecitationHistory: undefined
  SurahDetail: { surahId: number }
}

// This is for screen-to-screen navigation with nested navigators
export type RootTabParamList = {
  Home: undefined
  // These definitions allow nested navigation to screens within these stacks
  Memorize:
    | {
        screen?: keyof MemorizationStackParamList
        params?: {
          surahId?: number
          ayahId?: number
        }
      }
    | undefined
  Progress:
    | {
        screen?: keyof ProgressStackParamList
        params?: {
          surahId?: number
        }
      }
    | undefined
  Profile: undefined
}
export type SettingsStackParamList = {
  // Existing settings screens
  SettingsMain: undefined
  // Add the new screen
  QuranSettings: undefined
}

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>

export type MemorizationScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<MemorizationStackParamList, 'MemorizationMain'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList, 'Memorize'>,
    StackNavigationProp<RootStackParamList>
  >
>
