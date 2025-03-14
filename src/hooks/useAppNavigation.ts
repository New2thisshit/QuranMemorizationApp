// src/hooks/useAppNavigation.ts
import { useNavigation } from '@react-navigation/native'
import { CompositeNavigationProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import {
  MemorizationStackParamList,
  ProgressStackParamList,
  AppTabParamList,
  RootTabParamList,
} from '../types/navigation'

// Correct syntax for CompositeNavigationProp
type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  CompositeNavigationProp<
    StackNavigationProp<MemorizationStackParamList>,
    StackNavigationProp<ProgressStackParamList>
  >
>

export const useAppNavigation = () => {
  return useNavigation<AppNavigationProp>()
}
