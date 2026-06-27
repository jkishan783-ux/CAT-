import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Analytics API Schema Interfaces
interface SectionInsight {
  sectionName: 'VARC' | 'DILR' | 'QA';
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  netScore: number;
  accuracy: number;
  timeSpentSeconds: number;
}

interface TopicInsight {
  topic: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  netScore: number;
  accuracy: number;
  timeSpentSeconds: number;
}

interface GradedAnswer {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  questionText: string;
  isCorrect: boolean;
  timeSpent: number;
  scoreContribution: number;
  section: string;
  topic: string;
}

interface ScorecardScreenProps {
  score: {
    totalScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracy: number;
  };
  analytics: {
    timeTraps: string[];
    sectionalInsights: Record<'VARC' | 'DILR' | 'QA', SectionInsight>;
    topicMatrix: Record<string, TopicInsight>;
  };
  gradedAnswers: GradedAnswer[];
  onClose: () => void;
}

export default function ScorecardScreen({
  score,
  analytics,
  gradedAnswers,
  onClose,
}: ScorecardScreenProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const sections = Object.values(analytics.sectionalInsights);
  const topics = Object.values(analytics.topicMatrix);

  // Find the questions corresponding to the time traps
  const timeTrapQuestions = gradedAnswers.filter((ans) =>
    analytics.timeTraps.includes(ans.questionId)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exam Scorecard</Text>
          <Text style={styles.headerSubtitle}>Performance Analytics Report</Text>
        </View>

        {/* Global Summary Grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Score</Text>
            <Text style={[styles.summaryValue, styles.primaryText]}>{score.totalScore}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Accuracy %</Text>
            <Text style={[styles.summaryValue, score.accuracy >= 80 ? styles.successText : styles.warningText]}>
              {score.accuracy}%
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Time Traps</Text>
            <Text style={[styles.summaryValue, timeTrapQuestions.length > 0 ? styles.dangerText : styles.successText]}>
              {timeTrapQuestions.length}
            </Text>
          </View>
        </View>

        {/* Time Trap Alarm Panel */}
        {timeTrapQuestions.length > 0 ? (
          <View style={styles.alarmPanel}>
            <Text style={styles.alarmTitle}>🚨 Attention: Time Traps Identified!</Text>
            <Text style={styles.alarmDescription}>
              You spent more than 3 minutes (180s) on the following questions and answered incorrectly. Analyze these concepts to avoid stalling on exam day:
            </Text>

            {timeTrapQuestions.map((q, idx) => (
              <View key={q.questionId} style={styles.trapItem}>
                <Text style={styles.trapNum}>Time Trap #{idx + 1} ({q.section} • {q.topic})</Text>
                <Text style={styles.trapText} numberOfLines={3}>{q.questionText}</Text>
                <View style={styles.trapMetrics}>
                  <Text style={styles.trapMetricText}>⏱️ Spent: {formatTime(q.timeSpent)}</Text>
                  <Text style={styles.trapMetricText}>❌ Correct Answer: {q.correctAnswer}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.successPanel}>
            <Text style={styles.successPanelTitle}>🚀 Excellent Time Management!</Text>
            <Text style={styles.successPanelDesc}>
              No time traps detected. You did not spend excessive time (>3 minutes) on questions answered incorrectly.
            </Text>
          </View>
        )}

        {/* Sectional Performance */}
        <Text style={styles.sectionHeading}>Sectional Analysis</Text>
        <View style={styles.insightsList}>
          {sections.map((sec) => (
            <View key={sec.sectionName} style={styles.insightCard}>
              <View style={styles.insightCardHeader}>
                <Text style={styles.insightCardName}>{sec.sectionName}</Text>
                <Text style={styles.insightScore}>Net: {sec.netScore} pts</Text>
              </View>
              
              <View style={styles.insightsGrid}>
                <View style={styles.insightGridItem}>
                  <Text style={styles.insightGridLabel}>Accuracy</Text>
                  <Text style={styles.insightGridValue}>{sec.accuracy}%</Text>
                </View>
                <View style={styles.insightGridItem}>
                  <Text style={styles.insightGridLabel}>Correct/Total</Text>
                  <Text style={styles.insightGridValue}>
                    {sec.correctCount}/{sec.attemptedCount}
                  </Text>
                </View>
                <View style={styles.insightGridItem}>
                  <Text style={styles.insightGridLabel}>Time Spent</Text>
                  <Text style={styles.insightGridValue}>{formatTime(sec.timeSpentSeconds)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Topic Matrix analysis */}
        <Text style={styles.sectionHeading}>Topic Diagnostic Matrix</Text>
        <View style={styles.matrixContainer}>
          <View style={styles.matrixHeaderRow}>
            <Text style={[styles.matrixHeaderCol, styles.colTopic]}>Topic</Text>
            <Text style={[styles.matrixHeaderCol, styles.colMetric]}>Correct</Text>
            <Text style={[styles.matrixHeaderCol, styles.colMetric]}>Net</Text>
            <Text style={[styles.matrixHeaderCol, styles.colMetric]}>Accuracy</Text>
          </View>

          {topics.map((t) => (
            <View key={t.topic} style={styles.matrixRow}>
              <Text style={[styles.matrixColText, styles.colTopic, styles.whiteText]} numberOfLines={1}>
                {t.topic}
              </Text>
              <Text style={[styles.matrixColText, styles.colMetric]}>
                {t.correctCount}/{t.attemptedCount}
              </Text>
              <Text style={[styles.matrixColText, styles.colMetric, t.netScore >= 0 ? styles.successText : styles.dangerText]}>
                {t.netScore > 0 ? `+${t.netScore}` : t.netScore}
              </Text>
              <Text style={[styles.matrixColText, styles.colMetric, styles.boldText]}>
                {t.accuracy}%
              </Text>
            </View>
          ))}
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2F2F37',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#8E8E9F',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  primaryText: {
    color: '#3B82F6',
  },
  successText: {
    color: '#10B981',
  },
  warningText: {
    color: '#F59E0B',
  },
  dangerText: {
    color: '#EF4444',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  alarmPanel: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 16,
    marginBottom: 24,
  },
  alarmTitle: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  alarmDescription: {
    color: '#B5A6A6',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  trapItem: {
    backgroundColor: '#1C1313',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  trapNum: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  trapText: {
    color: '#E1E1E6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  trapMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trapMetricText: {
    color: '#8E8E9F',
    fontSize: 11,
  },
  successPanel: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 16,
    marginBottom: 24,
  },
  successPanelTitle: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  successPanelDesc: {
    color: '#A6B5AD',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 10,
  },
  insightsList: {
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F2F37',
    marginBottom: 12,
  },
  insightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F2F37',
    paddingBottom: 8,
  },
  insightCardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  insightScore: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightGridItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  insightGridLabel: {
    color: '#8E8E9F',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  insightGridValue: {
    color: '#E1E1E6',
    fontSize: 13,
    fontWeight: '600',
  },
  matrixContainer: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F2F37',
    overflow: 'hidden',
    marginBottom: 28,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#16161B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2F2F37',
  },
  matrixHeaderCol: {
    color: '#8E8E9F',
    fontSize: 11,
    fontWeight: '600',
  },
  colTopic: {
    flex: 2,
    textAlign: 'left',
  },
  colMetric: {
    flex: 1,
    textAlign: 'right',
  },
  matrixRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#25252B',
  },
  matrixColText: {
    fontSize: 13,
    color: '#8E8E9F',
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
