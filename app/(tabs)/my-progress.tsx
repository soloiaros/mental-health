import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function MyProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>My Progress</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c9c9c9' : '#444' }]}>
        Phase 4 will add Chaos Blob + Timeline here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

