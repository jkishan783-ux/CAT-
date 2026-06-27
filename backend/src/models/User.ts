import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  streakCounter: number;
  lastDailyTestDate: string | null; // Tracks Date as "YYYY-MM-DD"
  highestMockScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    streakCounter: { type: Number, default: 0 },
    lastDailyTestDate: { type: String, default: null }, // format: YYYY-MM-DD in user's local timezone (or UTC)
    highestMockScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
