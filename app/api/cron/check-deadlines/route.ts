import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { sendTelegramMessage, formatTaskReminder, formatParentNotification } from "@/lib/telegram";
import Test from "@/models/Test";
import Homework from "@/models/Homework";
import CodeExam from "@/models/CodeExam";
import TestSubmission from "@/models/TestSubmission";
import HomeworkSubmission from "@/models/HomeworkSubmission";
import CodeSubmission from "@/models/CodeSubmission";
import User from "@/models/User";

// This route is called by Vercel Cron
export async function GET(request: Request) {
  try {
    // Verify cron secret if configured
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const notificationsSent = [];

    // Check approaching test deadlines
    const approachingTests = await Test.find({
      deadline: { $gte: now, $lte: oneDayFromNow },
      status: "active",
    });

    for (const test of approachingTests) {
      const submissions = await TestSubmission.find({ testId: test._id }).distinct("studentId");
      const assignedStudents =
        test.assignedTo === "all"
          ? await User.find({ role: "student" })
          : await User.find({ _id: { $in: test.assignedTo } });

      for (const student of assignedStudents) {
        if (!submissions.some((id) => id.toString() === student._id.toString())) {
          // Send reminder to student
          if (student.telegramChatId) {
            const message = formatTaskReminder(
              student.name,
              1,
              new Date(test.deadline).toLocaleString()
            );
            await sendTelegramMessage({ chatId: student.telegramChatId, text: message });
            notificationsSent.push({
              type: "test-reminder",
              student: student.name,
              task: test.title,
            });
          }
        }
      }
    }

    // Check approaching homework deadlines
    const approachingHomework = await Homework.find({
      deadline: { $gte: now, $lte: oneDayFromNow },
    });

    for (const homework of approachingHomework) {
      const submissions = await HomeworkSubmission.find({ homeworkId: homework._id }).distinct(
        "studentId"
      );
      const assignedStudents =
        homework.assignedTo === "all"
          ? await User.find({ role: "student" })
          : await User.find({ _id: { $in: homework.assignedTo } });

      for (const student of assignedStudents) {
        if (!submissions.some((id) => id.toString() === student._id.toString())) {
          if (student.telegramChatId) {
            const message = formatTaskReminder(
              student.name,
              1,
              new Date(homework.deadline).toLocaleString()
            );
            await sendTelegramMessage({ chatId: student.telegramChatId, text: message });
            notificationsSent.push({
              type: "homework-reminder",
              student: student.name,
              task: homework.title,
            });
          }
        }
      }
    }

    // Check missed deadlines and notify parents
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const missedTests = await Test.find({
      deadline: { $gte: yesterday, $lte: now },
      status: "active",
    });

    for (const test of missedTests) {
      const submissions = await TestSubmission.find({ testId: test._id }).distinct("studentId");
      const assignedStudents =
        test.assignedTo === "all"
          ? await User.find({ role: "student" })
          : await User.find({ _id: { $in: test.assignedTo } });

      for (const student of assignedStudents) {
        if (
          !submissions.some((id) => id.toString() === student._id.toString()) &&
          student.parentTelegramChatId
        ) {
          const message = formatParentNotification(
            student.name,
            new Date().toISOString().split("T")[0],
            0,
            1,
            [test.title]
          );
          await sendTelegramMessage({ chatId: student.parentTelegramChatId, text: message });
          notificationsSent.push({
            type: "parent-overdue-alert",
            student: student.name,
            task: test.title,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent: notificationsSent.length,
      details: notificationsSent,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process deadline checks" },
      { status: 500 }
    );
  }
}
