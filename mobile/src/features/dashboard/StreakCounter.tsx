import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StreakCounterProps {
  streakCount: number;
  lastTestDate: string | null;
  hasTakenToday: boolean;
}

export default function StreakCounter({ streakCount, lastTestDate, hasTakenToday }: StreakCounterProps) {
  return (
    <View style={styles.card}>
      <View style={styles.streakRow}>
        <View style={styles.flameContainer}>
          {/* Flame Emoji / Asset representation */}
          <Text style={styles.flameEmoji}>🔥</Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.streakNumber}>{streakCount} Day{streakCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.streakLabel}>Current Daily Streak</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusContainer}>
        {hasTakenToday ? (
          <View style={styles.statusBadgeCompleted}>
            <Text style={styles.statusBadgeTextCompleted}>✅ Today's Test Completed</Text>
          </View>
        ) : (
          <View style={styles.statusBadgePending}>
            <Text style={styles.statusBadgeTextPending}>⚠️ Today's Test Pending</Text>
          </View>
        )}
        
        <Text style={styles.streakHint}>
          {hasTakenToday
            ? "Awesome work! Come back tomorrow to keep the streak alive."
            : "Complete today's 10-question test before midnight to keep your streak!"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2F2F37',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(249, 115, 22, 0.15)', // light orange background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flameEmoji: {
    fontSize: 32,
  },
  textContainer: {
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F97316', // Orange theme
  },
  streakLabel: {
    fontSize: 14,
    color: '#8E8E9F',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#2F2F37',
    marginVertical: 16,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 8,
  },
  statusBadgeTextCompleted: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 8,
  },
  statusBadgeTextPending: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 13,
  },
  streakHint: {
    color: '#8E8E9F',
    fontSize: 12,
    lineHeight: 18,
  },
});
