import mongoose, { Schema, Document } from 'mongoose';

export type SectionType = 'VARC' | 'DILR' | 'QA';
export type QuestionType = 'MCQ' | 'TITA';
export type TestType = 'mock' | 'sectional' | 'daily' | 'interval';

export interface IQuestion extends Document {
  groupId: string | null; // For grouping DILR caselets or RC passages
  passageText?: string;   // Optional passage text (shared across same groupId)
  section: SectionType;
  type: QuestionType;
  questionText: string;   // Markdown / LaTeX mathematical string
  options: string[];      // Array of option strings (empty for TITA)
  correctAnswer: string;  // Correct answer string (e.g. choice text or raw input value)
  targetTestType: TestType;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    groupId: { type: String, default: null, index: true },
    passageText: { type: String, default: '' },
    section: { type: String, enum: ['VARC', 'DILR', 'QA'], required: true },
    type: { type: String, enum: ['MCQ', 'TITA'], required: true },
    questionText: { type: String, required: true },
    options: { type: [String], default: [] }, // Array of options, e.g. ["A", "B", "C", "D"]
    correctAnswer: { type: String, required: true },
    targetTestType: { type: String, enum: ['mock', 'sectional', 'daily', 'interval'], required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuestion>('Question', QuestionSchema);
