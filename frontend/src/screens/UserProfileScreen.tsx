import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function UserProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Profile Screen Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
  }
});
