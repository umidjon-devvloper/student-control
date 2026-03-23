import mongoose, { Schema, Document } from "mongoose";

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ICodeExam extends Document {
  title: string;
  description?: string;
  language: "javascript" | "python" | "html" | "css";
  starterCode: string;
  referenceSolution?: string; // Admin's correct solution for comparison
  taskDescription: string;
  hints: string[];
  timeLimit: number; // in minutes
  deadline: Date;
  assignedTo: mongoose.Types.ObjectId[] | "all";
  maxScore: number;
  passingScore: number;
  testCases: ITestCase[];
  status: "draft" | "active" | "closed";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const CodeExamSchema = new Schema<ICodeExam>(
  {
    title: { type: String, required: true },
    description: { type: String },
    language: {
      type: String,
      enum: ["javascript", "python", "html", "css"],
      required: true,
    },
    starterCode: { type: String, default: "" },
    referenceSolution: { type: String, default: "" },
    taskDescription: { type: String, required: true },
    hints: { type: [String], default: [] },
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
    maxScore: { type: Number, required: true },
    passingScore: { type: Number, required: true },
    testCases: { type: [TestCaseSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.CodeExam ||
  mongoose.model<ICodeExam>("CodeExam", CodeExamSchema);
