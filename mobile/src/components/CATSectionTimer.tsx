import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';

interface CATSectionTimerProps {
  sections: Array<{ sectionName: string; timeLimitMinutes: number }>;
  currentSectionIndex: number;
  onSectionComplete: (index: number) => void;
  onTestComplete: () => void;
}

export default function CATSectionTimer({
  sections,
  currentSectionIndex,
  onSectionComplete,
  onTestComplete,
}: CATSectionTimerProps) {
  const activeSection = sections[currentSectionIndex];
  // Convert minutes to seconds
  const [secondsLeft, setSecondsLeft] = useState(activeSection ? activeSection.timeLimitMinutes * 60 : 0);

  // Sync state whenever the section index changes
  useEffect(() => {
    if (activeSection) {
      setSecondsLeft(activeSection.timeLimitMinutes * 60);
    }
  }, [currentSectionIndex]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleTimeExpired = () => {
    const isLastSection = currentSectionIndex === sections.length - 1;
    const sectionName = activeSection ? activeSection.sectionName : '';

    Alert.alert(
      'Time Expired!',
      isLastSection
        ? `Time is up for ${sectionName}. Your exam is being submitted.`
        : `Time is up for ${sectionName}. Moving to the next section.`,
      [{ text: 'OK' }]
    );

    if (isLastSection) {
      onTestComplete();
    } else {
      onSectionComplete(currentSectionIndex + 1);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        {sections.map((section, index) => {
          const isActive = index === currentSectionIndex;
          const isCompleted = index < currentSectionIndex;

          return (
            <View
              key={section.sectionName}
              style={[
                styles.sectionBadge,
                isActive && styles.activeBadge,
                isCompleted && styles.completedBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isActive && styles.activeBadgeText,
                  isCompleted && styles.completedBadgeText,
                ]}
              >
                {section.sectionName}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Time Remaining for {activeSection?.sectionName}:</Text>
        <Text style={[styles.timerValue, secondsLeft < 120 && styles.warningText]}>
          {formatTime(secondsLeft)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionBadge: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1E1E24',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  activeBadge: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  completedBadge: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    opacity: 0.7,
  },
  badgeText: {
    color: '#8E8E9F',
    fontWeight: '600',
    fontSize: 13,
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
  completedBadgeText: {
    color: '#FFFFFF',
  },
  timerCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  timerLabel: {
    color: '#8E8E9F',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  warningText: {
    color: '#EF4444',
  },
});
