// In a new file like src/hooks/useAppNavigation.ts
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  MemorizationStackParamList, 
  AppTabParamList,
  ProgressStackParamList 
} from '../types/navigation';

type AppNavigationProp = CompositeNavigationProp
  StackNavigationProp<MemorizationStackParamList>,
  StackNavigationProp<AppTabParamList & {
    Progress: { screen?: keyof ProgressStackParamList; params?: any }
  }>


export const useAppNavigation = () => {
  return useNavigation<AppNavigationProp>();
};