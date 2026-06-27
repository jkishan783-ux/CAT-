import { calculateCATScore, AnswerSubmission } from '../utils/scoringEngine';
import { IQuestion } from '../models/Question';
import mongoose from 'mongoose';

// Utility helper to create mock Question documents (minimizing DB overhead)
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
    ...fields,
  } as IQuestion;
}

describe('CAT Scoring Engine tests', () => {
  const qMcq = createMockQuestion({ type: 'MCQ', correctAnswer: 'A' });
  const qTita = createMockQuestion({ type: 'TITA', correctAnswer: '42', options: [] });
  const questions = [qMcq, qTita];

  test('All Correct submissions: should score +6 (3 + 3) and 100% accuracy', () => {
    const submissions: AnswerSubmission[] = [
      { questionId: qMcq._id.toString(), selectedAnswer: 'A', timeSpent: 10 },
      { questionId: qTita._id.toString(), selectedAnswer: '42', timeSpent: 15 },
    ];

    const results = calculateCATScore(submissions, questions);

    expect(results.totalScore).toBe(6);
    expect(results.correctCount).toBe(2);
    expect(results.incorrectCount).toBe(0);
    expect(results.unattemptedCount).toBe(0);
    expect(results.attemptedCount).toBe(2);
    expect(results.accuracy).toBe(100);
  });

  test('MCQ Incorrect and TITA Correct: should score +2 (-1 + 3) and 50% accuracy', () => {
    const submissions: AnswerSubmission[] = [
      { questionId: qMcq._id.toString(), selectedAnswer: 'B', timeSpent: 10 }, // MCQ incorrect (-1)
      { questionId: qTita._id.toString(), selectedAnswer: '42', timeSpent: 15 }, // TITA correct (+3)
    ];

    const results = calculateCATScore(submissions, questions);

    expect(results.totalScore).toBe(2);
    expect(results.correctCount).toBe(1);
    expect(results.incorrectCount).toBe(1);
    expect(results.unattemptedCount).toBe(0);
    expect(results.accuracy).toBe(50);
  });

  test('MCQ Correct and TITA Incorrect: should score +3 (3 + 0) and 50% accuracy (no negative markings for TITA)', () => {
    const submissions: AnswerSubmission[] = [
      { questionId: qMcq._id.toString(), selectedAnswer: 'A', timeSpent: 10 }, // MCQ correct (+3)
      { questionId: qTita._id.toString(), selectedAnswer: '99', timeSpent: 15 }, // TITA incorrect (0)
    ];

    const results = calculateCATScore(submissions, questions);

    expect(results.totalScore).toBe(3);
    expect(results.correctCount).toBe(1);
    expect(results.incorrectCount).toBe(1);
    expect(results.unattemptedCount).toBe(0);
    expect(results.accuracy).toBe(50);
  });

  test('Partial submissions with unattempted fields: should score +3 (3 + 0 unattempted) and 100% accuracy on attempted', () => {
    const submissions: AnswerSubmission[] = [
      { questionId: qMcq._id.toString(), selectedAnswer: 'A', timeSpent: 10 }, // MCQ correct (+3)
      { questionId: qTita._id.toString(), selectedAnswer: '', timeSpent: 0 },  // Unattempted (0)
    ];

    const results = calculateCATScore(submissions, questions);

    expect(results.totalScore).toBe(3);
    expect(results.correctCount).toBe(1);
    expect(results.incorrectCount).toBe(0);
    expect(results.unattemptedCount).toBe(1);
    expect(results.attemptedCount).toBe(1);
    expect(results.accuracy).toBe(100);
  });
});
