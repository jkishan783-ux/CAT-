import { IQuestion } from '../models/Question';

export interface AnswerSubmission {
  questionId: string;
  selectedAnswer: string; // Empty string if not attempted
  timeSpent: number;      // in seconds
}

export interface GradedAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  scoreContribution: number;
}

export interface ScoreCard {
  totalScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  attemptedCount: number;
  accuracy: number; // percentage (0 - 100)
  gradedAnswers: GradedAnswer[];
}

/**
 * Grades a list of user answer submissions against the actual question definitions in the database.
 * MCQ incorrect: -1
 * TITA incorrect: 0
 * Correct (MCQ or TITA): +3
 * Unattempted: 0
 */
export function calculateCATScore(
  submissions: AnswerSubmission[],
  questions: IQuestion[]
): ScoreCard {
  const questionMap = new Map<string, IQuestion>();
  questions.forEach((q) => {
    questionMap.set(q._id.toString(), q);
  });

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let attemptedCount = 0;

  const gradedAnswers: GradedAnswer[] = [];

  // Iterate over all actual questions to ensure we score everything, even if the user didn't submit an answer for it.
  questions.forEach((q) => {
    const questionIdStr = q._id.toString();
    const submission = submissions.find((sub) => sub.questionId === questionIdStr);

    const selectedAnswer = submission ? submission.selectedAnswer.trim() : '';
    const timeSpent = submission ? submission.timeSpent : 0;

    let isCorrect = false;
    let scoreContribution = 0;

    if (!selectedAnswer) {
      // Unattempted question
      unattemptedCount++;
    } else {
      attemptedCount++;
      // Compare answers case-insensitively and trim spaces
      const isMatch = selectedAnswer.toLowerCase() === q.correctAnswer.trim().toLowerCase();

      if (isMatch) {
        isCorrect = true;
        scoreContribution = 3;
        correctCount++;
      } else {
        isCorrect = false;
        incorrectCount++;
        if (q.type === 'MCQ') {
          scoreContribution = -1;
        } else {
          scoreContribution = 0; // No negative marking for TITA
        }
      }
    }

    totalScore += scoreContribution;

    gradedAnswers.push({
      questionId: questionIdStr,
      selectedAnswer,
      isCorrect,
      timeSpent,
      scoreContribution,
    });
  });

  const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  // Round accuracy to 2 decimal places
  const roundedAccuracy = Math.round(accuracy * 100) / 100;

  return {
    totalScore,
    correctCount,
    incorrectCount,
    unattemptedCount,
    attemptedCount,
    accuracy: roundedAccuracy,
    gradedAnswers,
  };
}
