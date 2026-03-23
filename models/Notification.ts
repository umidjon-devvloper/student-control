import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  type: "test" | "code-exam" | "homework" | "monthly-exam" | "general";
  sentAt: Date;
  channel: "telegram" | "web";
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  relatedType?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["test", "code-exam", "homework", "monthly-exam", "general"],
      required: true,
    },
    sentAt: { type: Date, default: Date.now },
    channel: { type: String, enum: ["telegram", "web"], required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: Schema.Types.ObjectId },
    relatedType: { type: String },
  },
  { timestamps: true }
);

// Index for querying user's notifications
NotificationSchema.index({ userId: 1, isRead: 1, sentAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
