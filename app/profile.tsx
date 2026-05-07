import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { TouchableTap } from '@/components/ui/TouchableTap';
import { useTrackingStore } from '@/store/trackingStore';
import { colors, radii, shadows, spacing, text } from '@/theme';
import { localDayKey } from '@/utils/date';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const emotionLogs = useTrackingStore((s) => s.emotionLogs);
  const selfRespectLogs = useTrackingStore((s) => s.selfRespectLogs);
  const clearAll = useTrackingStore((s) => s.clearAll);

  const stats = useMemo(() => {
    const days = new Set<string>();
    for (const e of emotionLogs) days.add(localDayKey(e.timestamp));
    for (const s of selfRespectLogs) days.add(localDayKey(s.timestamp));
    return {
      emotions: emotionLogs.length,
      respect: selfRespectLogs.length,
      days: days.size,
    };
  }, [emotionLogs, selfRespectLogs]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableTap
          onPress={() => router.back()}
          accessibilityLabel="Close profile"
          style={styles.closeBtn}
          pressedScale={0.92}
        >
          <View style={styles.closeBtnInner}>
            <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
          </View>
        </TouchableTap>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={36} color={colors.onSecondaryContainer} />
          </View>
          <Text style={styles.heroTitle}>Your private garden</Text>
          <Text style={styles.heroSubtitle}>
            Everything you log lives only on this device. No accounts, no telemetry.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Emotions" value={stats.emotions} icon="bubble-chart" tint={colors.primary} />
          <StatCard label="Self‑respect" value={stats.respect} icon="grade" tint={colors.tertiary} />
          <StatCard label="Days active" value={stats.days} icon="event-available" tint={colors.secondary} />
        </View>

        <SectionTitle>Preferences</SectionTitle>
        <View style={styles.list}>
          <RowItem icon="palette" title="Appearance" subtitle="Light · System default" />
          <RowItem icon="alarm" title="Reminders" subtitle="Off" />
          <RowItem icon="ios-share" title="Export data" subtitle="Coming soon" />
        </View>

        <SectionTitle>Privacy</SectionTitle>
        <View style={styles.list}>
          <RowItem icon="lock" title="App lock" subtitle="Off" />
          <RowItem
            icon="delete"
            title="Erase everything"
            subtitle="Remove all logs from this device"
            onPress={clearAll}
            destructive
          />
        </View>

        <Text style={styles.footer}>The Canvas · v1.0</Text>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  tint: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: tint + '1A' }]}>
        <MaterialIcons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RowItem({
  icon,
  title,
  subtitle,
  onPress,
  destructive,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const content = (
    <View style={styles.rowItem}>
      <View
        style={[
          styles.rowIconWrap,
          destructive && { backgroundColor: colors.errorContainer },
        ]}
      >
        <MaterialIcons
          name={icon}
          size={18}
          color={destructive ? colors.onErrorContainer : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, destructive && { color: colors.error }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? (
        <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <TouchableTap onPress={onPress} accessibilityLabel={title} pressedScale={0.99}>
        {content}
      </TouchableTap>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
  },
  closeBtnInner: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    ...shadows.raisedSm,
  },
  headerTitle: {
    ...text.h3,
    fontSize: 20,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xxl,
    padding: spacing.md + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.raisedSm,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadows.raisedSm,
  },
  heroTitle: {
    ...text.h2,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...text.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.raisedSm,
    gap: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit,
  },
  statValue: {
    ...text.h2,
    fontSize: 24,
    color: colors.onSurface,
  },
  statLabel: {
    ...text.labelSm,
    color: colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...text.labelOverline,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: 1.4,
  },
  list: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    overflow: 'hidden',
    ...shadows.raisedSm,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceVariant,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...text.bodyMd,
    color: colors.onSurface,
    fontFamily: 'Inter_500Medium',
  },
  rowSubtitle: {
    ...text.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  footer: {
    ...text.labelSm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
