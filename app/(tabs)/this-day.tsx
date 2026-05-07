import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ThisDayScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>This Day</Text>
      <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.62)' }]}>
        Choose what you want to track today.
      </Text>

      <View style={styles.cards}>
        <HubCard
          title="Emotion Canvas"
          description="Drop feelings as bubbles on an infinite space."
          icon="heart-outline"
          onPress={() => router.push('/(tabs)/this-day-canvas?mode=emotion&open=1')}
        />
        <HubCard
          title="Self-Respect Wall"
          description="Log boundaries and wins as golden cards."
          icon="shield-checkmark-outline"
          onPress={() => router.push('/(tabs)/this-day-canvas?mode=selfRespect&open=1')}
        />
      </View>
    </View>
  );
}

function HubCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={20} color="#0B0B0C" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.55)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  cards: {
    marginTop: 18,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: '#0B0B0C',
    fontSize: 16,
    fontWeight: '900',
  },
  cardDesc: {
    marginTop: 2,
    color: 'rgba(0,0,0,0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
});

