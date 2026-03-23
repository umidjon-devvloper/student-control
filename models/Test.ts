import mongoose, { Schema, Document } from "mongoose";

export interface IOption {
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  questionText: string;
  options: IOption[];
  correctAnswer: "A" | "B" | "C" | "D";
  points: number;
}

export interface ITest extends Document {
  title: string;
  description?: string;
  subject: string;
  questions: IQuestion[];
  timeLimit: number; // in minutes
  deadline: Date;
  assignedTo: mongoose.Types.ObjectId[] | "all";
  totalPoints: number;
  passingScore: number;
  status: "draft" | "active" | "closed";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>({
  label: { type: String, enum: ["A", "B", "C", "D"], required: true },
  text: { type: String, required: true },
});

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  options: { type: [OptionSchema], required: true },
  correctAnswer: { type: String, enum: ["A", "B", "C", "D"], required: true },
  points: { type: Number, required: true, default: 1 },
});

const TestSchema = new Schema<ITest>(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
    timeLimit: { type: Number, required: true },
    deadline: { type: Date, required: true },
    assignedTo: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (v: unknown) {
          return v === "all" || Array.isArray(v);
        },
        message: "assignedTo must be 'all' or an array of user IDs",
      },
    },
    totalPoints: { type: Number, required: true },
    passingScore: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Test || mongoose.model<ITest>("Test", TestSchema);
