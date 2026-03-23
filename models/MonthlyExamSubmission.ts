import mongoose, { Schema, Document } from "mongoose";

export interface IMonthlyExamSubmission extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  zipUrl?: string;
  githubLink?: string;
  description?: string;
  score?: number;
  feedback?: string;
  submittedAt: Date;
  isLate: boolean;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
}

const MonthlyExamSubmissionSchema = new Schema<IMonthlyExamSubmission>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "MonthlyExam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    zipUrl: { type: String },
    githubLink: { type: String },
    description: { type: String },
    score: { type: Number },
    feedback: { type: String },
    submittedAt: { type: Date, required: true },
    isLate: { type: Boolean, default: false },
    gradedAt: { type: Date },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Compound index to ensure one submission per student per exam
MonthlyExamSubmissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.MonthlyExamSubmission ||
  mongoose.model<IMonthlyExamSubmission>("MonthlyExamSubmission", MonthlyExamSubmissionSchema);
