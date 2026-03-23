import mongoose, { Schema, Document } from "mongoose";

export interface IHomeworkAnswer {
  questionId: mongoose.Types.ObjectId;
  textAnswer?: string;
  codeAnswer?: string;
}

export interface IHomeworkSubmission extends Document {
  homeworkId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IHomeworkAnswer[];
  score?: number;
  aiFeedback?: string;
  submittedAt: Date;
  isLate: boolean;
}

const HomeworkAnswerSchema = new Schema<IHomeworkAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  textAnswer: { type: String },
  codeAnswer: { type: String },
});

const HomeworkSubmissionSchema = new Schema<IHomeworkSubmission>(
  {
    homeworkId: { type: Schema.Types.ObjectId, ref: "Homework", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [HomeworkAnswerSchema], default: [] },
    score: { type: Number },
    aiFeedback: { type: String },
    submittedAt: { type: Date, required: true },
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index to ensure one submission per student per homework
HomeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.HomeworkSubmission ||
  mongoose.model<IHomeworkSubmission>("HomeworkSubmission", HomeworkSubmissionSchema);
