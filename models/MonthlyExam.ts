import mongoose, { Schema, Document } from "mongoose";

export interface IMonthlyExam extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  requirements: string;
  maxScore: number;
  announcedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyExamSchema = new Schema<IMonthlyExam>(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    requirements: { type: String, required: true },
    maxScore: { type: Number, required: true },
    announcedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.MonthlyExam ||
  mongoose.model<IMonthlyExam>("MonthlyExam", MonthlyExamSchema);
