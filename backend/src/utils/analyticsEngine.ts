import { IQuestion } from '../models/Question';
import { GradedAnswer } from './scoringEngine';

export interface SectionInsight {
  sectionName: 'VARC' | 'DILR' | 'QA';
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  netScore: number;
  accuracy: number; // percentage (0-100)
  timeSpentSeconds: number;
}

export interface TopicInsight {
  topic: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  netScore: number;
  accuracy: number; // percentage (0-100)
  timeSpentSeconds: number;
}

export interface AnalyticsReport {
  timeTraps: string[]; // List of Question IDs where user spent > 180s and answered incorrectly
  sectionalInsights: Record<'VARC' | 'DILR' | 'QA', SectionInsight>;
  topicMatrix: Record<string, TopicInsight>;
}

/**
 * Generates an advanced analytics report from graded answers and their full question definitions.
 */
export function generateAnalyticsReport(
  gradedAnswers: GradedAnswer[],
  questions: IQuestion[]
): AnalyticsReport {
  const questionMap = new Map<string, IQuestion>();
  questions.forEach((q) => {
    questionMap.set(q._id.toString(), q);
  });

  const timeTraps: string[] = [];

  // Initialize Section Insights
  const sectionalInsights: Record<'VARC' | 'DILR' | 'QA', SectionInsight> = {
    VARC: { sectionName: 'VARC', totalQuestions: 0, attemptedCount: 0, correctCount: 0, incorrectCount: 0, netScore: 0, accuracy: 0, timeSpentSeconds: 0 },
    DILR: { sectionName: 'DILR', totalQuestions: 0, attemptedCount: 0, correctCount: 0, incorrectCount: 0, netScore: 0, accuracy: 0, timeSpentSeconds: 0 },
    QA: { sectionName: 'QA', totalQuestions: 0, attemptedCount: 0, correctCount: 0, incorrectCount: 0, netScore: 0, accuracy: 0, timeSpentSeconds: 0 },
  };

  // Initialize Topic Insights
  const topicMatrix: Record<string, TopicInsight> = {};

  gradedAnswers.forEach((ans) => {
    const q = questionMap.get(ans.questionId);
    if (!q) return;

    const isAttempted = ans.selectedAnswer.trim() !== '';

    // 1. Time Trap check: spent > 180 seconds and answered incorrectly
    if (ans.timeSpent > 180 && !ans.isCorrect && isAttempted) {
      timeTraps.push(ans.questionId);
    }

    // 2. Sectional Insights update
    const sec = q.section;
    const secReport = sectionalInsights[sec];
    if (secReport) {
      secReport.totalQuestions++;
      secReport.timeSpentSeconds += ans.timeSpent;
      if (isAttempted) {
        secReport.attemptedCount++;
        if (ans.isCorrect) {
          secReport.correctCount++;
        } else {
          secReport.incorrectCount++;
        }
      }
      secReport.netScore += ans.scoreContribution;
    }

    // 3. Topic Matrix update
    const topic = q.topic || 'General';
    if (!topicMatrix[topic]) {
      topicMatrix[topic] = {
        topic,
        totalQuestions: 0,
        attemptedCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        netScore: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      };
    }
    const topicReport = topicMatrix[topic];
    topicReport.totalQuestions++;
    topicReport.timeSpentSeconds += ans.timeSpent;
    if (isAttempted) {
      topicReport.attemptedCount++;
      if (ans.isCorrect) {
        topicReport.correctCount++;
      } else {
        topicReport.incorrectCount++;
      }
    }
    topicReport.netScore += ans.scoreContribution;
  });

  // Calculate percentages (Accuracy %) for Sections
  (Object.keys(sectionalInsights) as Array<'VARC' | 'DILR' | 'QA'>).forEach((key) => {
    const sec = sectionalInsights[key];
    const rawAcc = sec.attemptedCount > 0 ? (sec.correctCount / sec.attemptedCount) * 100 : 0;
    sec.accuracy = Math.round(rawAcc * 100) / 100;
  });

  // Calculate percentages (Accuracy %) for Topics
  Object.keys(topicMatrix).forEach((key) => {
    const topic = topicMatrix[key];
    const rawAcc = topic.attemptedCount > 0 ? (topic.correctCount / topic.attemptedCount) * 100 : 0;
    topic.accuracy = Math.round(rawAcc * 100) / 100;
  });

  return {
    timeTraps,
    sectionalInsights,
    topicMatrix,
  };
}
