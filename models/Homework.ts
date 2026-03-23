import mongoose, { Schema, Document } from "mongoose";

export interface IHomeworkQuestion {
  _id?: mongoose.Types.ObjectId;
  text: string;
  type: "text" | "code";
}

export interface IHomework extends Document {
  title: string;
  description?: string;
  type: "review" | "code" | "mixed";
  deadline: Date;
  assignedTo: mongoose.Types.ObjectId[] | "all";
  questions: IHomeworkQuestion[];
  starterCode?: string;
  maxScore: number;
  passingScore: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkQuestionSchema = new Schema<IHomeworkQuestion>({
  text: { type: String, required: true },
  type: { type: String, enum: ["text", "code"], required: true },
});

const HomeworkSchema = new Schema<IHomework>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["review", "code", "mixed"],
      required: true,
    },
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
    questions: { type: [HomeworkQuestionSchema], default: [] },
    starterCode: { type: String },
    maxScore: { type: Number, required: true },
    passingScore: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Homework ||
  mongoose.model<IHomework>("Homework", HomeworkSchema);
