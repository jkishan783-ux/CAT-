import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Question, { IQuestion } from '../models/Question';
import Attempt from '../models/Attempt';
import User from '../models/User';
import { calculateCATScore } from '../utils/scoringEngine';
import { calculateNewStreak } from '../utils/streakTracker';
import { getIntervalWindow } from '../utils/intervalWindow';
import { generateAnalyticsReport } from '../utils/analyticsEngine';

// Helper to hash string to a deterministic positive integer
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Helper to deterministically pick N questions from an array using a key
function selectDeterministicQuestions(questions: IQuestion[], count: number, key: string): IQuestion[] {
  if (questions.length <= count) {
    return questions;
  }
  const seed = hashStringToInt(key);
  const startIndex = seed % questions.length;
  
  const selected: IQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const index = (startIndex + i) % questions.length;
    selected.push(questions[index]);
  }
  return selected;
}

/**
 * GET /api/tests/daily
 * Returns the 10-question daily test for today.
 * Prevents multiple attempts by returning completion status.
 */
export async function getDailyTest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const clientDateStr = (req.query.date as string) || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if user already completed a daily test today
    const existingAttempt = await Attempt.findOne({
      userId,
      testType: 'daily',
      testId: clientDateStr, // We store the date string as testId for daily tests
    });

    if (existingAttempt) {
      return res.json({
        alreadyAttempted: true,
        score: existingAttempt.score,
        totalDurationSpent: existingAttempt.totalDurationSpent,
        completedAt: existingAttempt.completedAt,
      });
    }

    // Fetch all Daily Questions
    const dailyQuestions = await Question.find({ targetTestType: 'daily' }).sort({ _id: 1 });
    if (dailyQuestions.length === 0) {
      return res.status(404).json({ error: 'No daily questions found in database.' });
    }

    // Deterministically pick 10 questions for today
    const pickedQuestions = selectDeterministicQuestions(dailyQuestions, 10, clientDateStr);

    // Remove correct answers before sending to client to prevent cheating
    const scrubbedQuestions = pickedQuestions.map((q) => {
      const obj = q.toObject();
      delete obj.correctAnswer;
      return obj;
    });

    return res.json({
      alreadyAttempted: false,
      testId: clientDateStr,
      timeLimitMinutes: 20, // Daily test: 20 minutes cutoff
      questions: scrubbedQuestions,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/tests/interval
 * Returns the 4-question 6-hour interval test (12 AM, 6 AM, 12 PM, 6 PM).
 */
export async function getIntervalTest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const { windowKey, startTime, endTime, nextRefreshTime } = getIntervalWindow(now);

    // Check if user already attempted the interval test for the current 6-hour block
    const existingAttempt = await Attempt.findOne({
      userId,
      testType: 'interval',
      testId: windowKey,
    });

    if (existingAttempt) {
      return res.json({
        alreadyAttempted: true,
        windowKey,
        nextRefreshTime,
        score: existingAttempt.score,
      });
    }

    // Fetch all Interval Questions
    const intervalQuestions = await Question.find({ targetTestType: 'interval' }).sort({ _id: 1 });
    if (intervalQuestions.length === 0) {
      return res.status(404).json({ error: 'No interval test questions found.' });
    }

    // Deterministically pick 4 questions for this window key
    const pickedQuestions = selectDeterministicQuestions(intervalQuestions, 4, windowKey);

    // Remove correct answers
    const scrubbedQuestions = pickedQuestions.map((q) => {
      const obj = q.toObject();
      delete obj.correctAnswer;
      return obj;
    });

    return res.json({
      alreadyAttempted: false,
      windowKey,
      startTime,
      endTime,
      nextRefreshTime,
      timeLimitMinutes: 12, // Interval test: 12 minutes
      questions: scrubbedQuestions,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/tests/mock/:id
 * Fetches a Mock Test with sectional structure.
 * Order: VARC -> DILR -> QA.
 */
export async function getMockTest(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; // mock test identifier e.g., "mock_1"
    
    // Fetch all mock questions for this identifier
    // In a production system, we'd have a MockTest metadata table. 
    // Here we query Questions targeting 'mock' and optionally matching groupId or just sectional distribution.
    const mockQuestions = await Question.find({ targetTestType: 'mock' });
    
    if (mockQuestions.length === 0) {
      return res.status(404).json({ error: 'No mock test questions found.' });
    }

    // Group by section
    const varc = mockQuestions.filter((q) => q.section === 'VARC');
    const dilr = mockQuestions.filter((q) => q.section === 'DILR');
    const qa = mockQuestions.filter((q) => q.section === 'QA');

    // Scrub answers
    const scrub = (qList: IQuestion[]) =>
      qList.map((q) => {
        const obj = q.toObject();
        delete obj.correctAnswer;
        return obj;
      });

    return res.json({
      testId: id,
      title: `CAT Full-Length Mock Test ${id}`,
      sections: [
        {
          sectionName: 'VARC',
          timeLimitMinutes: 40,
          questions: scrub(varc),
        },
        {
          sectionName: 'DILR',
          timeLimitMinutes: 40,
          questions: scrub(dilr),
        },
        {
          sectionName: 'QA',
          timeLimitMinutes: 40,
          questions: scrub(qa),
        },
      ],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/tests/submit
 * Grades a test attempt, updates daily streaks/highest scores, and returns detailed results.
 */
export async function submitTest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { testType, testId, answers, durationSpent, clientDateStr } = req.body;

    if (!testType || !answers || !Array.isArray(answers) || durationSpent === undefined) {
      return res.status(400).json({ error: 'Missing required submission parameters.' });
    }

    // Validate active session
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // 1. Fetch exact questions to prevent client-side answer injection
    const questionIds = answers.map((a: any) => new mongoose.Types.ObjectId(a.questionId));
    const questions = await Question.find({ _id: { $in: questionIds } });

    // 2. Score the submissions
    const scoreCard = calculateCATScore(answers, questions);

    // 3. Save Attempt
    const newAttempt = new Attempt({
      userId,
      testType,
      testId: testId || null,
      answers: scoreCard.gradedAnswers.map((g) => ({
        questionId: new mongoose.Types.ObjectId(g.questionId),
        selectedAnswer: g.selectedAnswer,
        isCorrect: g.isCorrect,
        timeSpent: g.timeSpent,
      })),
      score: {
        totalScore: scoreCard.totalScore,
        correctCount: scoreCard.correctCount,
        incorrectCount: scoreCard.incorrectCount,
        unattemptedCount: scoreCard.unattemptedCount,
        accuracy: scoreCard.accuracy,
      },
      totalDurationSpent: durationSpent,
      completedAt: new Date(),
    });

    await newAttempt.save();

    // 4. Update stats based on testType
    let streakUpdated = false;
    let oldStreak = user.streakCounter;

    if (testType === 'daily') {
      const todayStr = clientDateStr || new Date().toISOString().split('T')[0];
      const streakResult = calculateNewStreak(user.lastDailyTestDate, todayStr, user.streakCounter);
      
      user.streakCounter = streakResult.streak;
      user.lastDailyTestDate = todayStr;
      streakUpdated = streakResult.updated;
    }

    if (testType === 'mock') {
      if (scoreCard.totalScore > user.highestMockScore) {
        user.highestMockScore = scoreCard.totalScore;
      }
    }

    await user.save();

    // Return the response scorecard WITH the correct answers so user can review
    const enrichedGradedAnswers = scoreCard.gradedAnswers.map((g) => {
      const fullQuestion = questions.find((q) => q._id.toString() === g.questionId);
      return {
        ...g,
        correctAnswer: fullQuestion ? fullQuestion.correctAnswer : '',
        questionText: fullQuestion ? fullQuestion.questionText : '',
        options: fullQuestion ? fullQuestion.options : [],
        section: fullQuestion ? fullQuestion.section : '',
        type: fullQuestion ? fullQuestion.type : '',
        passageText: fullQuestion?.passageText || '',
      };
    });

    // 5. Generate advanced analytics report
    const analytics = generateAnalyticsReport(scoreCard.gradedAnswers, questions);

    return res.json({
      message: 'Test submitted successfully.',
      attemptId: newAttempt._id,
      score: {
        totalScore: scoreCard.totalScore,
        correctCount: scoreCard.correctCount,
        incorrectCount: scoreCard.incorrectCount,
        unattemptedCount: scoreCard.unattemptedCount,
        accuracy: scoreCard.accuracy,
      },
      streak: {
        currentStreak: user.streakCounter,
        streakUpdated,
        previousStreak: oldStreak,
      },
      analytics,
      gradedAnswers: enrichedGradedAnswers,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/leaderboard
 * Returns top users ranked by highest mock test scores and daily streaks.
 */
export async function getLeaderboard(req: AuthenticatedRequest, res: Response) {
  try {
    // Top 20 Mock Test scorers
    const topMockScorers = await User.find({}, 'name email highestMockScore streakCounter')
      .sort({ highestMockScore: -1 })
      .limit(20);

    // Top 20 Daily Streak holders
    const topStreakHolders = await User.find({}, 'name email highestMockScore streakCounter')
      .sort({ streakCounter: -1 })
      .limit(20);

    return res.json({
      topMockScorers,
      topStreakHolders,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
