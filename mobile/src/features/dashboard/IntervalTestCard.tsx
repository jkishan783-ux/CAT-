import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface IntervalTestCardProps {
  isAttempted: boolean;
  onAttemptPress: () => void;
}

export default function IntervalTestCard({ isAttempted, onAttemptPress }: IntervalTestCardProps) {
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const currentHours = now.getHours();

      // Find the next refresh boundary (00:00, 06:00, 12:00, 18:00 of today/tomorrow)
      const currentIntervalIndex = Math.floor(currentHours / 6);
      const nextIntervalHour = (currentIntervalIndex + 1) * 6;

      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        nextIntervalHour,
        0,
        0,
        0
      );

      const diffMs = targetDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeftStr('00h 00m 00s');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeftStr(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>6-Hour Interval Test</Text>
          <Text style={styles.subtitle}>4 Questions • 12 Mins</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Dynamic</Text>
        </View>
      </View>

      <Text style={styles.description}>
        A quick diagnostic set that refreshes every 6 hours synced to 12 AM, 6 AM, 12 PM, and 6 PM.
      </Text>

      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Next Refresh In:</Text>
        <Text style={styles.timerValue}>{timeLeftStr}</Text>
      </View>

      {isAttempted ? (
        <View style={styles.disabledButton}>
          <Text style={styles.disabledButtonText}>Attempted for this Window</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.actionButton} onPress={onAttemptPress}>
          <Text style={styles.actionButtonText}>Start Interval Test</Text>
        </TouchableOpacity>
      )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E9F',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  badgeText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: '#8E8E9F',
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 12,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16161B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#25252B',
  },
  timerLabel: {
    color: '#8E8E9F',
    fontSize: 12,
  },
  timerValue: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  actionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  disabledButton: {
    backgroundColor: '#25252C',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  disabledButtonText: {
    color: '#535362',
    fontWeight: '600',
    fontSize: 15,
  },
});
