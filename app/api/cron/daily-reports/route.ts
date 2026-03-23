import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  sendTelegramMessage,
  formatStudentDailyReport,
  formatParentNotification,
} from "@/lib/telegram";
import Test from "@/models/Test";
import Homework from "@/models/Homework";
import CodeExam from "@/models/CodeExam";
import TestSubmission from "@/models/TestSubmission";
import HomeworkSubmission from "@/models/HomeworkSubmission";
import CodeSubmission from "@/models/CodeSubmission";
import User from "@/models/User";

// This route is called by Vercel Cron - runs every day at 8 PM
export async function GET(request: Request) {
  try {
    // Verify cron secret if configured
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateString = today.toISOString().split("T")[0];
    const notificationsSent: Array<{
      type: string;
      student: string;
      recipient: "student" | "parent";
    }> = [];

    // Get all students
    const students = await User.find({ role: "student" });

    for (const student of students) {
      // Get today's assignments for this student
      const todaysTests = await Test.find({
        deadline: { $gte: today },
        status: "active",
        $or: [{ assignedTo: "all" }, { assignedTo: student._id }],
      });

      const todaysHomework = await Homework.find({
        deadline: { $gte: today },
        $or: [{ assignedTo: "all" }, { assignedTo: student._id }],
      });

      const todaysCodeExams = await CodeExam.find({
        deadline: { $gte: today },
        status: "active",
        $or: [{ assignedTo: "all" }, { assignedTo: student._id }],
      });

      // Check which tasks are completed
      const tasks: Array<{ title: string; completed: boolean; score?: number }> = [];
      const pendingTasks: string[] = [];
      let completedCount = 0;
      let totalCount = 0;

      // Check tests
      for (const test of todaysTests) {
        totalCount++;
        const submission = await TestSubmission.findOne({
          studentId: student._id,
          testId: test._id,
          submittedAt: { $gte: today, $lt: tomorrow },
        });

        const isCompleted = !!submission;
        if (isCompleted) {
          completedCount++;
        } else {
          pendingTasks.push(test.title);
        }

        tasks.push({
          title: test.title,
          completed: isCompleted,
          score: submission?.percentage,
        });
      }

      // Check homework
      for (const hw of todaysHomework) {
        totalCount++;
        const submission = await HomeworkSubmission.findOne({
          studentId: student._id,
          homeworkId: hw._id,
          submittedAt: { $gte: today, $lt: tomorrow },
        });

        const isCompleted = !!submission;
        if (isCompleted) {
          completedCount++;
        } else {
          pendingTasks.push(hw.title);
        }

        tasks.push({
          title: hw.title,
          completed: isCompleted,
          score: submission?.finalScore,
        });
      }

      // Check code exams
      for (const exam of todaysCodeExams) {
        totalCount++;
        const submission = await CodeSubmission.findOne({
          studentId: student._id,
          examId: exam._id,
          submittedAt: { $gte: today, $lt: tomorrow },
        });

        const isCompleted = !!submission;
        if (isCompleted) {
          completedCount++;
        } else {
          pendingTasks.push(exam.title);
        }

        tasks.push({
          title: exam.title,
          completed: isCompleted,
          score: submission?.finalScore,
        });
      }

      // Send daily report to student
      if (student.telegramChatId && totalCount > 0) {
        const studentMessage = formatStudentDailyReport(
          student.name,
          dateString,
          completedCount,
          totalCount,
          tasks
        );

        const success = await sendTelegramMessage({
          chatId: student.telegramChatId,
          text: studentMessage,
        });

        if (success) {
          notificationsSent.push({
            type: "daily-report",
            student: student.name,
            recipient: "student",
          });
        }
      }

      // Send notification to parent if there are pending tasks
      if (student.parentTelegramChatId && pendingTasks.length > 0) {
        const parentMessage = formatParentNotification(
          student.name,
          dateString,
          completedCount,
          totalCount,
          pendingTasks
        );

        const success = await sendTelegramMessage({
          chatId: student.parentTelegramChatId,
          text: parentMessage,
        });

        if (success) {
          notificationsSent.push({
            type: "parent-notification",
            student: student.name,
            recipient: "parent",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: dateString,
      notificationsSent: notificationsSent.length,
      details: notificationsSent,
    });
  } catch (error) {
    console.error("Daily reports cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process daily reports" },
      { status: 500 }
    );
  }
}
