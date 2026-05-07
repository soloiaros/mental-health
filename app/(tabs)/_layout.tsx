import React from 'react';
import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/ui/GlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="this-day"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="this-day" options={{ title: 'This Day' }} />
      <Tabs.Screen name="my-progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
