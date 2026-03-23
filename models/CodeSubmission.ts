import mongoose, { Schema, Document } from "mongoose";

export interface IAIReview {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  codeQuality: "excellent" | "good" | "needs_work";
  encouragement: string;
}

export interface ICodeSubmission extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submittedCode: string;
  language: string;
  aiReview?: IAIReview;
  adminScore?: number;
  feedback?: string;
  finalScore?: number;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number; // in seconds
  tabSwitchCount: number;
  isLate: boolean;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
}

const AIReviewSchema = new Schema<IAIReview>({
  score: { type: Number, required: true },
  summary: { type: String, required: true },
  strengths: { type: [String], required: true },
  improvements: { type: [String], required: true },
  codeQuality: {
    type: String,
    enum: ["excellent", "good", "needs_work"],
    required: true,
  },
  encouragement: { type: String, required: true },
});

const CodeSubmissionSchema = new Schema<ICodeSubmission>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "CodeExam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedCode: { type: String, default: "" },
    language: { type: String, required: true },
    aiReview: { type: AIReviewSchema },
    adminScore: { type: Number },
    feedback: { type: String },
    finalScore: { type: Number },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    timeSpent: { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    gradedAt: { type: Date },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Compound index to ensure one submission per student per exam
CodeSubmissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.CodeSubmission ||
  mongoose.model<ICodeSubmission>("CodeSubmission", CodeSubmissionSchema);
