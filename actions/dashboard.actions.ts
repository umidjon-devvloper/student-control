"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Test from "@/models/Test";
import TestSubmission from "@/models/TestSubmission";
import Homework from "@/models/Homework";
import HomeworkSubmission from "@/models/HomeworkSubmission";
import CodeExam from "@/models/CodeExam";
import CodeSubmission from "@/models/CodeSubmission";
import { ActionResult } from "./auth.actions";

export interface AdminStats {
  totalStudents: number;
  activeToday: number;
  homeworkCompletionRate: number;
  avgScoreThisMonth: number;
  pendingSubmissions: number;
  missedDeadlineStudents: Array<{
    name: string;
    task: string;
    deadline: Date;
    type: string;
  }>;
}

export interface StudentStats {
  upcomingTests: number;
  pendingHomework: number;
  codeExamsAvailable: number;
  avgScore: number;
  rank: number;
  recentSubmissions: Array<{
    title: string;
    type: string;
    score: number;
    submittedAt: Date;
  }>;
  // Daily progress
  dailyProgress: {
    date: string;
    completed: number;
    total: number;
    tasks: Array<{
      title: string;
      type: string;
      completed: boolean;
      score?: number;
    }>;
  };
  // Monthly summary
  monthlySummary: {
    month: string;
    totalTasks: number;
    completedTasks: number;
    averageScore: number;
    testsTaken: number;
    homeworkCompleted: number;
    codeExamsCompleted: number;
    bestScore: number;
    improvement: number; // percentage change from previous month
  };
}

export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const totalStudents = await User.countDocuments({ role: "student" });

    // Active today (submitted something in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeToday = await TestSubmission.distinct("studentId", {
      submittedAt: { $gte: oneDayAgo },
    }).then((ids) => ids.length);

    // Homework completion rate
    const totalHomework = await Homework.countDocuments();
    const completedHomework = await HomeworkSubmission.countDocuments();
    const totalPossibleSubmissions = totalHomework * totalStudents;
    const homeworkCompletionRate =
      totalPossibleSubmissions > 0
        ? Math.round((completedHomework / totalPossibleSubmissions) * 100)
        : 0;

    // Average score this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const testScores = await TestSubmission.aggregate([
      { $match: { submittedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, avgScore: { $avg: "$percentage" } } },
    ]);

    const codeScores = await CodeSubmission.aggregate([
      { $match: { submittedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, avgScore: { $avg: "$finalScore" } } },
    ]);

    const avgTestScore = testScores[0]?.avgScore || 0;
    const avgCodeScore = codeScores[0]?.avgScore || 0;
    const avgScoreThisMonth = Math.round((avgTestScore + avgCodeScore) / 2);

    // Pending submissions
    const now = new Date();
    const pendingTests = await Test.countDocuments({
      deadline: { $gte: now },
      status: "active",
    });
    const pendingHomework = await Homework.countDocuments({
      deadline: { $gte: now },
    });
    const pendingCodeExams = await CodeExam.countDocuments({
      deadline: { $gte: now },
      status: "active",
    });
    const pendingSubmissions = pendingTests + pendingHomework + pendingCodeExams;

    // Missed deadlines
    const missedDeadlineStudents: AdminStats["missedDeadlineStudents"] = [];

    const overdueTests = await Test.find({
      deadline: { $lt: now },
      status: "active",
    });

    for (const test of overdueTests) {
      const submissions = await TestSubmission.find({ testId: test._id }).distinct(
        "studentId"
      );
      const assignedStudents =
        test.assignedTo === "all"
          ? await User.find({ role: "student" }).select("_id name")
          : await User.find({ _id: { $in: test.assignedTo } }).select("_id name");

      for (const student of assignedStudents) {
        if (!submissions.some((id) => id.toString() === student._id.toString())) {
          missedDeadlineStudents.push({
            name: student.name,
            task: test.title,
            deadline: test.deadline,
            type: "Test",
          });
        }
      }
    }

    return {
      success: true,
      data: {
        totalStudents,
        activeToday,
        homeworkCompletionRate,
        avgScoreThisMonth,
        pendingSubmissions,
        missedDeadlineStudents,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    };
  }
}

export async function getStudentStats(): Promise<ActionResult<StudentStats>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const studentId = session.user.id;
    const now = new Date();

    // Upcoming tests assigned to this student
    const upcomingTests = await Test.countDocuments({
      deadline: { $gte: now },
      status: "active",
      $or: [{ assignedTo: "all" }, { assignedTo: studentId }],
    });

    // Pending homework
    const pendingHomework = await Homework.countDocuments({
      deadline: { $gte: now },
      $or: [{ assignedTo: "all" }, { assignedTo: studentId }],
    });

    // Available code exams
    const codeExamsAvailable = await CodeExam.countDocuments({
      deadline: { $gte: now },
      status: "active",
      $or: [{ assignedTo: "all" }, { assignedTo: studentId }],
    });

    // Average score
    const testSubmissions = await TestSubmission.find({ studentId });
    const codeSubmissions = await CodeSubmission.find({ studentId });

    const testAvg =
      testSubmissions.length > 0
        ? testSubmissions.reduce((sum, s) => sum + s.percentage, 0) /
          testSubmissions.length
        : 0;

    const codeAvg =
      codeSubmissions.length > 0
        ? codeSubmissions.reduce(
            (sum, s) => sum + (s.finalScore || 0),
            0
          ) / codeSubmissions.length
        : 0;

    const avgScore = Math.round((testAvg + codeAvg) / 2);

    // Calculate rank (simplified - based on average score)
    const allStudents = await User.find({ role: "student" }).select("_id");
    const rank = 1; // Simplified - would need full leaderboard calculation

    // Recent submissions
    const recentSubmissions: StudentStats["recentSubmissions"] = [];

    const recentTestSubs = await TestSubmission.find({ studentId })
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate("testId", "title");

    for (const sub of recentTestSubs) {
      if (sub.submittedAt) {
        recentSubmissions.push({
          title: (sub.testId as unknown as { title: string }).title,
          type: "Test",
          score: sub.percentage,
          submittedAt: sub.submittedAt,
        });
      }
    }

    // Daily Progress - Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active assignments for today
    const todaysTests = await Test.find({
      deadline: { $gte: today },
      status: "active",
      $or: [{ assignedTo: "all" }, { assignedTo: studentId }],
    }).select("title _id");

    const todaysHomework = await Homework.find({
      deadline: { $gte: today },
      $or: [{ assignedTo: "all" }, { assignedTo: studentId }],
    }).select("title _id");

    const todaysCodeExams = await CodeExam.find({
      deadline: { $gte: today },
      status: "active",
      $or: [{ assignedTo: "all" }, { assignedTo: studentId }],
    }).select("title _id");

    // Check which ones are completed today
    const dailyTasks: StudentStats["dailyProgress"]["tasks"] = [];
    let completedToday = 0;

    for (const test of todaysTests) {
      const submission = await TestSubmission.findOne({
        studentId,
        testId: test._id,
        submittedAt: { $gte: today, $lt: tomorrow },
      });
      const isCompleted = !!submission;
      if (isCompleted) completedToday++;
      dailyTasks.push({
        title: test.title,
        type: "Test",
        completed: isCompleted,
        score: submission?.percentage,
      });
    }

    for (const hw of todaysHomework) {
      const submission = await HomeworkSubmission.findOne({
        studentId,
        homeworkId: hw._id,
        submittedAt: { $gte: today, $lt: tomorrow },
      });
      const isCompleted = !!submission;
      if (isCompleted) completedToday++;
      dailyTasks.push({
        title: hw.title,
        type: "Homework",
        completed: isCompleted,
        score: submission?.finalScore,
      });
    }

    for (const exam of todaysCodeExams) {
      const submission = await CodeSubmission.findOne({
        studentId,
        examId: exam._id,
        submittedAt: { $gte: today, $lt: tomorrow },
      });
      const isCompleted = !!submission;
      if (isCompleted) completedToday++;
      dailyTasks.push({
        title: exam.title,
        type: "Code Exam",
        completed: isCompleted,
        score: submission?.finalScore,
      });
    }

    const dailyProgress: StudentStats["dailyProgress"] = {
      date: today.toISOString().split("T")[0],
      completed: completedToday,
      total: dailyTasks.length,
      tasks: dailyTasks,
    };

    // Monthly Summary
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfPrevMonth = new Date(startOfMonth);
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);

    // This month's submissions
    const thisMonthTestSubs = await TestSubmission.find({
      studentId,
      submittedAt: { $gte: startOfMonth },
    });

    const thisMonthHomeworkSubs = await HomeworkSubmission.find({
      studentId,
      submittedAt: { $gte: startOfMonth },
    });

    const thisMonthCodeSubs = await CodeSubmission.find({
      studentId,
      submittedAt: { $gte: startOfMonth },
    });

    // Previous month's submissions for comparison
    const prevMonthTestSubs = await TestSubmission.find({
      studentId,
      submittedAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
    });

    const prevMonthHomeworkSubs = await HomeworkSubmission.find({
      studentId,
      submittedAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
    });

    const prevMonthCodeSubs = await CodeSubmission.find({
      studentId,
      submittedAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
    });

    // Calculate scores
    const thisMonthScores = [
      ...thisMonthTestSubs.map((s) => s.percentage),
      ...thisMonthHomeworkSubs.map((s) => s.finalScore || 0),
      ...thisMonthCodeSubs.map((s) => s.finalScore || 0),
    ];

    const prevMonthScores = [
      ...prevMonthTestSubs.map((s) => s.percentage),
      ...prevMonthHomeworkSubs.map((s) => s.finalScore || 0),
      ...prevMonthCodeSubs.map((s) => s.finalScore || 0),
    ];

    const thisMonthAvg = thisMonthScores.length > 0
      ? thisMonthScores.reduce((a, b) => a + b, 0) / thisMonthScores.length
      : 0;

    const prevMonthAvg = prevMonthScores.length > 0
      ? prevMonthScores.reduce((a, b) => a + b, 0) / prevMonthScores.length
      : 0;

    const improvement = prevMonthAvg > 0
      ? Math.round(((thisMonthAvg - prevMonthAvg) / prevMonthAvg) * 100)
      : 0;

    const monthlySummary: StudentStats["monthlySummary"] = {
      month: startOfMonth.toLocaleString("default", { month: "long", year: "numeric" }),
      totalTasks: thisMonthTestSubs.length + thisMonthHomeworkSubs.length + thisMonthCodeSubs.length,
      completedTasks: thisMonthTestSubs.length + thisMonthHomeworkSubs.length + thisMonthCodeSubs.length,
      averageScore: Math.round(thisMonthAvg),
      testsTaken: thisMonthTestSubs.length,
      homeworkCompleted: thisMonthHomeworkSubs.length,
      codeExamsCompleted: thisMonthCodeSubs.length,
      bestScore: thisMonthScores.length > 0 ? Math.max(...thisMonthScores) : 0,
      improvement,
    };

    return {
      success: true,
      data: {
        upcomingTests,
        pendingHomework,
        codeExamsAvailable,
        avgScore,
        rank,
        recentSubmissions,
        dailyProgress,
        monthlySummary,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    };
  }
}
