export type RootStackParamList = {
  Auth: undefined
  App: undefined
}

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: { email: string }
  OTPVerification: { email: string; mode: 'register' | 'password-reset' }
  ResetPassword: { email: string; code: string }
}

export type AppTabParamList = {
  Home: undefined
  Memorize: undefined
  Progress: undefined
  Profile: undefined
}

export type MemorizationStackParamList = {
  MemorizationMain: undefined
  SurahList: undefined
  AyahList: { surahId: number }
  Recite: { ayahId: number; surahId: number }
}

export type ProgressStackParamList = {
  ProgressMain: undefined
  Stats: undefined
  RecitationHistory: undefined
  SurahDetail: { surahId: number }
}

// This is for screen-to-screen navigation
export type NavigationParams = AppTabParamList & {
  // Allow navigating to nested stacks with the screen param
  Memorize: { screen: string; params?: any }
  Progress: { screen: string; params?: any }
}

export type RootTabParamList = {
  Home: undefined
  Memorize: undefined
  Progress: { screen?: keyof ProgressStackParamList; params?: any }
  Profile: undefined
}
