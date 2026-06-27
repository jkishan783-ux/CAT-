import { generateAnalyticsReport } from '../utils/analyticsEngine';
import { IQuestion } from '../models/Question';
import { GradedAnswer } from '../utils/scoringEngine';
import mongoose from 'mongoose';

// Utility helper to create mock Question documents
function createMockQuestion(fields: Partial<IQuestion>): IQuestion {
  return {
    _id: new mongoose.Types.ObjectId(),
    groupId: null,
    passageText: '',
    section: 'QA',
    type: 'MCQ',
    questionText: 'Mock Question',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    targetTestType: 'mock',
    topic: 'Algebra',
    ...fields,
  } as IQuestion;
}

describe('Advanced Analytics Engine tests', () => {
  const qVarcRc = createMockQuestion({ _id: new mongoose.Types.ObjectId(), section: 'VARC', topic: 'RC Main Idea' });
  const qDilrSet = createMockQuestion({ _id: new mongoose.Types.ObjectId(), section: 'DILR', topic: 'Data Interpretation' });
  const qQaLog = createMockQuestion({ _id: new mongoose.Types.ObjectId(), section: 'QA', topic: 'Logarithms' });
  const qQaFunc = createMockQuestion({ _id: new mongoose.Types.ObjectId(), section: 'QA', topic: 'Functions' });
  
  const questions = [qVarcRc, qDilrSet, qQaLog, qQaFunc];

  test('Generate analytics report correctly computes sectional metrics, topics, and time traps', () => {
    const gradedAnswers: GradedAnswer[] = [
      {
        questionId: qVarcRc._id.toString(),
        selectedAnswer: 'A',
        isCorrect: true,
        timeSpent: 120,
        scoreContribution: 3,
      },
      {
        questionId: qDilrSet._id.toString(),
        selectedAnswer: 'B', // Incorrect MCQ
        isCorrect: false,
        timeSpent: 200, // Spent > 180s on wrong answer -> Time Trap!
        scoreContribution: -1,
      },
      {
        questionId: qQaLog._id.toString(),
        selectedAnswer: 'A',
        isCorrect: true,
        timeSpent: 90,
        scoreContribution: 3,
      },
      {
        questionId: qQaFunc._id.toString(),
        selectedAnswer: '', // Unattempted
        isCorrect: false,
        timeSpent: 10,
        scoreContribution: 0,
      },
    ];

    const report = generateAnalyticsReport(gradedAnswers, questions);

    // 1. Time Traps assertion
    expect(report.timeTraps).toContain(qDilrSet._id.toString());
    expect(report.timeTraps.length).toBe(1);

    // 2. Sectional Insights assertions
    expect(report.sectionalInsights.VARC.netScore).toBe(3);
    expect(report.sectionalInsights.VARC.accuracy).toBe(100);
    expect(report.sectionalInsights.VARC.timeSpentSeconds).toBe(120);

    expect(report.sectionalInsights.DILR.netScore).toBe(-1);
    expect(report.sectionalInsights.DILR.accuracy).toBe(0);
    expect(report.sectionalInsights.DILR.timeSpentSeconds).toBe(200);

    // QA has 2 questions: one correct (+3), one unattempted (0). Net score = 3
    expect(report.sectionalInsights.QA.netScore).toBe(3);
    expect(report.sectionalInsights.QA.attemptedCount).toBe(1);
    expect(report.sectionalInsights.QA.accuracy).toBe(100);
    expect(report.sectionalInsights.QA.timeSpentSeconds).toBe(100); // 90 + 10

    // 3. Topic Matrix assertions
    expect(report.topicMatrix['RC Main Idea'].netScore).toBe(3);
    expect(report.topicMatrix['RC Main Idea'].accuracy).toBe(100);

    expect(report.topicMatrix['Data Interpretation'].netScore).toBe(-1);
    expect(report.topicMatrix['Data Interpretation'].accuracy).toBe(0);

    expect(report.topicMatrix['Logarithms'].netScore).toBe(3);
    expect(report.topicMatrix['Logarithms'].accuracy).toBe(100);

    expect(report.topicMatrix['Functions'].netScore).toBe(0);
    expect(report.topicMatrix['Functions'].accuracy).toBe(0);
    expect(report.topicMatrix['Functions'].attemptedCount).toBe(0);
  });
});
