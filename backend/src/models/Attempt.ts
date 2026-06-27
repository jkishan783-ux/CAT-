import mongoose, { Schema, Document } from 'mongoose';
import { TestType } from './Question';

export interface IAnswerInput {
  questionId: mongoose.Types.ObjectId;
  selectedAnswer: string; // "Option A" or numerical value for TITA. Empty string if unattempted.
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

export interface IAttemptScore {
  totalScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracy: number; // calculated as (correctCount / attemptedCount) * 100
}

export interface IAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  testType: TestType;
  testId?: string; // ID of the test (if using a mock or sectional test ID reference)
  answers: IAnswerInput[];
  score: IAttemptScore;
  totalDurationSpent: number; // total duration of the test attempt in seconds
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerInputSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedAnswer: { type: String, default: '' }, // empty if unattempted
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, default: 0 },
});

const AttemptScoreSchema = new Schema({
  totalScore: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  incorrectCount: { type: Number, required: true },
  unattemptedCount: { type: Number, required: true },
  accuracy: { type: Number, required: true },
});

const AttemptSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testType: { type: String, enum: ['mock', 'sectional', 'daily', 'interval'], required: true },
    testId: { type: String, default: null },
    answers: { type: [AnswerInputSchema], default: [] },
    score: { type: AttemptScoreSchema, required: true },
    totalDurationSpent: { type: Number, required: true }, // in seconds
    completedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

AttemptSchema.index({ userId: 1, testId: 1 });
AttemptSchema.index({ completedAt: -1 });

export default mongoose.model<IAttempt>('Attempt', AttemptSchema);
