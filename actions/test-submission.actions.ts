"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import TestSubmission, { ITestSubmission } from "@/models/TestSubmission";
import Test from "@/models/Test";
import { ActionResult } from "./auth.actions";

export interface SubmitTestInput {
  testId: string;
  answers: { questionId: string; selectedOption: "A" | "B" | "C" | "D" }[];
  timeSpent: number;
  tabSwitchCount: number;
}

export async function submitTest(data: SubmitTestInput): Promise<ActionResult<ITestSubmission>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    // Get test to calculate score
    const test = await Test.findById(data.testId);
    if (!test) {
      return { success: false, error: "Test not found" };
    }

    // Check if already submitted
    const existingSubmission = await TestSubmission.findOne({
      testId: data.testId,
      studentId: session.user.id,
    });

    if (existingSubmission && existingSubmission.submittedAt) {
      return { success: false, error: "Test already submitted" };
    }

    // Calculate score
    let score = 0;
    const totalPoints = test.totalPoints;
    const pointsPerQuestion = totalPoints / test.questions.length;

    for (const answer of data.answers) {
      const question = test.questions.find(
        (q: any) => q._id.toString() === answer.questionId
      );
      if (question && question.correctAnswer === answer.selectedOption) {
        score += pointsPerQuestion;
      }
    }

    const percentage = Math.round((score / totalPoints) * 100);
    const isPassed = percentage >= test.passingScore;
    const isLate = new Date() > new Date(test.deadline);

    // Update or create submission
    let submission;
    if (existingSubmission) {
      submission = await TestSubmission.findByIdAndUpdate(
        existingSubmission._id,
        {
          answers: data.answers,
          score,
          percentage,
          isPassed,
          submittedAt: new Date(),
          timeSpent: data.timeSpent,
          tabSwitchCount: data.tabSwitchCount,
          isLate,
        },
        { new: true }
      );
    } else {
      submission = await TestSubmission.create({
        testId: data.testId,
        studentId: session.user.id,
        answers: data.answers,
        score,
        percentage,
        isPassed,
        startedAt: new Date(),
        submittedAt: new Date(),
        timeSpent: data.timeSpent,
        tabSwitchCount: data.tabSwitchCount,
        isLate,
      });
    }

    return { success: true, data: JSON.parse(JSON.stringify(submission)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit test",
    };
  }
}

export async function startTest(testId: string): Promise<ActionResult<ITestSubmission>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    // Check if already started or submitted
    let submission = await TestSubmission.findOne({
      testId,
      studentId: session.user.id,
    });

    if (submission && submission.submittedAt) {
      return { success: false, error: "Test already submitted" };
    }

    if (!submission) {
      submission = await TestSubmission.create({
        testId,
        studentId: session.user.id,
        answers: [],
        startedAt: new Date(),
      });
    }

    return { success: true, data: JSON.parse(JSON.stringify(submission)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start test",
    };
  }
}

export async function getTestSubmissions(testId: string): Promise<ActionResult<any[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submissions = await TestSubmission.find({ testId })
      .populate("studentId", "name username")
      .sort({ submittedAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(submissions)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch submissions",
    };
  }
}

export async function getStudentSubmissions(): Promise<ActionResult<any[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submissions = await TestSubmission.find({ studentId: session.user.id })
      .populate("testId", "title subject totalPoints passingScore")
      .sort({ submittedAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(submissions)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch submissions",
    };
  }
}

export async function getSubmissionById(submissionId: string): Promise<ActionResult<any>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submission = await TestSubmission.findById(submissionId)
      .populate("studentId", "name username")
      .populate("testId", "title subject questions totalPoints passingScore")
      .lean();

    if (!submission) {
      return { success: false, error: "Submission not found" };
    }

    // Students can only view their own submissions
    if (session.user.role === "student" && submission.studentId._id.toString() !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(submission)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch submission",
    };
  }
}

export async function getTestStats(testId: string): Promise<ActionResult<{
  totalSubmissions: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageTimeSpent: number;
}>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submissions = await TestSubmission.find({ testId, submittedAt: { $exists: true } });

    if (submissions.length === 0) {
      return {
        success: true,
        data: {
          totalSubmissions: 0,
          passedCount: 0,
          failedCount: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          averageTimeSpent: 0,
        },
      };
    }

    const totalSubmissions = submissions.length;
    const passedCount = submissions.filter((s) => s.isPassed).length;
    const scores = submissions.map((s) => s.percentage);
    const timeSpentValues = submissions.map((s) => s.timeSpent);

    return {
      success: true,
      data: {
        totalSubmissions,
        passedCount,
        failedCount: totalSubmissions - passedCount,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / totalSubmissions),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        averageTimeSpent: Math.round(timeSpentValues.reduce((a, b) => a + b, 0) / totalSubmissions),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch test stats",
    };
  }
}
