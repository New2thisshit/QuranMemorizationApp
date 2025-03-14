import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
} from 'react-native'

// Define an interface for file issues
interface IssueItem {
  type: string
  description: string
  suggestion: string
}

// Define an interface for files with issues
interface FileIssue {
  file: string
  issues: IssueItem[]
}

// List of files to check for common syntax errors
const CRITICAL_FILES: string[] = [
  'App.tsx',
  'src/navigation/RootNavigator.tsx',
  'src/navigation/AppNavigator.tsx',
  'src/navigation/AuthNavigator.tsx',
  'src/navigation/MemorizationNavigator.tsx',
  'src/navigation/ProgressNavigator.tsx',
  'src/screens/auth/OTPVerificationScreen.tsx',
  'src/screens/auth/ForgotPasswordScreen.tsx',
  'src/hooks/useAppNavigation.ts',
  'src/contexts/AuthContext.tsx',
  'src/contexts/QuranContext.tsx',
  'src/contexts/RecitationContext.tsx',
]

// Common syntax errors to check for
interface SyntaxCheck {
  pattern: RegExp
  description: string
}

const SYNTAX_CHECKS: SyntaxCheck[] = [
  {
    pattern: /[^\\]'\s*\+/,
    description: 'Potential string concatenation issue with single quotes',
  },
  {
    pattern: /[^\\]"\s*\+/,
    description: 'Potential string concatenation issue with double quotes',
  },
  {
    pattern: /import\s+{[^}]*,\s*}\s+from/,
    description: 'Trailing comma in import statement',
  },
  {
    pattern: /const\s+\w+\s*=\s*{[^}]*,\s*}\s*;/,
    description: 'Trailing comma in object literal',
  },
  {
    pattern: /^\s*return\s*\(\s*$[\s\S]*?^\s*\);?\s*$/m,
    description: 'Potential missing return value in parentheses',
  },
  {
    pattern: /import\s+\S+\s+from\s+[^'"]+;/,
    description: 'Missing quotes in import path',
  },
  {
    pattern: /const\s+navigation\s*=\s*useNavigation<NavigationProp<[^>]+>>\(\)/,
    description: 'NavigationProp usage issue',
  },
  {
    pattern: /([^:])\/\/\//,
    description: 'Triple slash comment could cause issues',
  },
  {
    pattern: /[^/]\/[^/\s]/,
    description: 'Potential unclosed regex or division operator',
  },
  {
    pattern: /:?\s*{[\s\S]*?\n\s*\w+:/,
    description: 'Missing comma in object literal',
  },
  { pattern: />\s*{\/\*/, description: 'JSX comment issues' },
  {
    pattern: /\(\s*\)[\s\n]*=>[\s\n]*{[\s\S]*?[^\s][\s\n]*}/,
    description: 'Arrow function body issue',
  },
  {
    pattern: /const\s+\[\s*.*,\s*set\w+\s*\]\s*=\s*useState<[^>]*>\(.*\)/,
    description: 'useState generic parameter issue',
  },
  {
    pattern: /:\s*([A-Z][A-Za-z0-9_]*)</,
    description: 'Possible generic type usage issue',
  },
]

// Navigation files syntax checks
const NAVIGATION_CHECKS: SyntaxCheck[] = [
  {
    pattern: /navigation\.navigate\(.*,.*\)/g,
    description: 'Navigation API usage issues',
  },
  {
    pattern: /useNavigation<\w+>\(\)/g,
    description: 'useNavigation hook type issues',
  },
  {
    pattern: /navigation\.setParams\(/g,
    description: 'setParams usage issues',
  },
  {
    pattern: /createStackNavigator<[^>]*>\(\)/g,
    description: 'Stack navigator type issues',
  },
]

// Mock function for file content retrieval (in a real app, this would read actual files)
const getFileContent = (filePath: string): string => {
  // Simulate retrieving file content
  return `// This is a mock of file ${filePath}
// In a real implementation, this would return the actual file content
import React from 'react';
import { View, Text } from 'react-native';

const Component = () => {
  return (
    <View>
      <Text>Example Component</Text>
    </View>
  );
};

export default Component;`
}

// Function to check a file for syntax issues
const checkFile = (filePath: string): IssueItem[] => {
  const content = getFileContent(filePath)
  const issues: IssueItem[] = []

  // Check for common syntax issues
  SYNTAX_CHECKS.forEach((check) => {
    if (check.pattern.test(content)) {
      issues.push({
        type: 'syntax',
        description: check.description,
        suggestion: `Review file for ${check.description} issues`,
      })
    }
  })

  // If it's a navigation file, perform additional checks
  if (filePath.includes('navigation')) {
    NAVIGATION_CHECKS.forEach((check) => {
      if (check.pattern.test(content)) {
        issues.push({
          type: 'navigation',
          description: check.description,
          suggestion: `Review navigation API usage`,
        })
      }
    })
  }

  return issues
}

// Main debugging component
const DebuggingAssistant: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [fileContent, setFileContent] = useState<string>('')
  const [issues, setIssues] = useState<FileIssue[]>([])
  const [fixing, setFixing] = useState<boolean>(false)
  const [fixSuggestion, setFixSuggestion] = useState<string>('')

  // Function to scan files for issues
  const scanFiles = () => {
    const allIssues: FileIssue[] = []

    CRITICAL_FILES.forEach((file) => {
      const fileIssues = checkFile(file)
      if (fileIssues.length > 0) {
        allIssues.push({
          file,
          issues: fileIssues,
        })
      }
    })

    setIssues(allIssues)
  }

  // Check for issues on component mount
  useEffect(() => {
    scanFiles()
  }, [])

  // Handle file selection
  const handleFileSelect = (file: string) => {
    setSelectedFile(file)
    setFileContent(getFileContent(file))
    setFixing(false)
  }

  // Generate fix suggestions
  const generateFixSuggestion = (file: string, issue: IssueItem) => {
    setFixing(true)
    setFixSuggestion(`
### Fix Suggestion for ${issue.description} in ${file}

1. Open the file: ${file}
2. Look for patterns matching: ${issue.description}
3. Common fixes:
   - Check for missing commas in object literals
   - Verify correct JSX syntax, especially with nested components
   - Ensure all parentheses and brackets are properly closed
   - Validate all import/export statements
   - Check for proper TypeScript generic syntax

For navigation issues, also verify:
- Correct usage of navigation.navigate() with proper parameters
- Proper typing of useNavigation<>() hook
- Correct nesting of navigation components

Example of correct navigation usage:
\`\`\`typescript
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const handleNavigate = () => {
    navigation.navigate('Details', { id: 123 });
  };
  
  return (...);
};
\`\`\`
    `)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>QuranApp Debugging Assistant</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Potential Issues Found:</Text>
        <ScrollView style={styles.issuesList}>
          {issues.length > 0 ? (
            issues.map((fileIssue, idx) => (
              <View key={idx} style={styles.issueItem}>
                <Text style={styles.issueFile}>{fileIssue.file}</Text>
                {fileIssue.issues.map((issue, i) => (
                  <View key={i} style={styles.issue}>
                    <Text style={styles.issueDesc}>{issue.description}</Text>
                    <Button
                      title="View Details"
                      onPress={() =>
                        generateFixSuggestion(fileIssue.file, issue)
                      }
                    />
                  </View>
                ))}
                <Button
                  title="View File"
                  onPress={() => handleFileSelect(fileIssue.file)}
                />
              </View>
            ))
          ) : (
            <Text style={styles.noIssues}>No obvious syntax issues found</Text>
          )}
        </ScrollView>
      </View>

      {selectedFile ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File: {selectedFile}</Text>
          <ScrollView style={styles.codeViewer}>
            <Text>{fileContent}</Text>
          </ScrollView>
        </View>
      ) : null}

      {fixing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fix Suggestion</Text>
          <ScrollView style={styles.fixSuggestion}>
            <Text>{fixSuggestion}</Text>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title="Scan Files Again" onPress={scanFiles} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E8B57',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  issuesList: {
    maxHeight: 200,
  },
  issueItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  issueFile: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 4,
  },
  issue: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ff9800',
  },
  issueDesc: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  noIssues: {
    fontStyle: 'italic',
    color: '#999',
  },
  codeViewer: {
    maxHeight: 200,
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  fixSuggestion: {
    maxHeight: 200,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  actions: {
    marginTop: 16,
  },
})

export default DebuggingAssistant
