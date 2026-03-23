import mongoose, { Schema, Document } from "mongoose";

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOption: "A" | "B" | "C" | "D";
}

export interface ITestSubmission extends Document {
  testId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  percentage: number;
  isPassed: boolean;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number; // in seconds
  tabSwitchCount: number;
  isLate: boolean;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  selectedOption: { type: String, enum: ["A", "B", "C", "D"], required: true },
});

const TestSubmissionSchema = new Schema<ITestSubmission>(
  {
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeSpent: { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index to ensure one submission per student per test
TestSubmissionSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.TestSubmission ||
  mongoose.model<ITestSubmission>("TestSubmission", TestSubmissionSchema);
