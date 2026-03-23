"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import CodeExam, { ICodeExam, ITestCase } from "@/models/CodeExam";
import CodeSubmission from "@/models/CodeSubmission";
import { ActionResult } from "./auth.actions";

export interface CreateCodeExamInput {
  title: string;
  description?: string;
  language: "javascript" | "python" | "html" | "css";
  starterCode: string;
  referenceSolution?: string;
  taskDescription: string;
  hints: string[];
  timeLimit: number;
  deadline: Date;
  assignedTo: string[] | "all";
  maxScore: number;
  passingScore: number;
  testCases: ITestCase[];
  status: "draft" | "active" | "closed";
}

export async function createCodeExam(
  data: CreateCodeExamInput
): Promise<ActionResult<ICodeExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await CodeExam.create({
      ...data,
      createdBy: session.user.id,
    });

    revalidatePath("/admin/code-exams");
    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create code exam",
    };
  }
}

export async function updateCodeExam(
  id: string,
  data: Partial<CreateCodeExamInput>
): Promise<ActionResult<ICodeExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await CodeExam.findByIdAndUpdate(id, data, { new: true });

    if (!exam) {
      return { success: false, error: "Code exam not found" };
    }

    revalidatePath("/admin/code-exams");
    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update code exam",
    };
  }
}

export async function deleteCodeExam(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    await CodeExam.findByIdAndDelete(id);

    revalidatePath("/admin/code-exams");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete code exam",
    };
  }
}

export async function getCodeExams(): Promise<ActionResult<ICodeExam[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exams = await CodeExam.find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(exams)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch code exams",
    };
  }
}

export async function getActiveCodeExamsForStudent(): Promise<ActionResult<ICodeExam[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const now = new Date();
    const exams = await CodeExam.find({
      status: "active",
      deadline: { $gte: now },
      $or: [{ assignedTo: "all" }, { assignedTo: session.user.id }],
    }).sort({ deadline: 1 });

    return { success: true, data: JSON.parse(JSON.stringify(exams)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch code exams",
    };
  }
}

export async function getCodeExamById(id: string): Promise<ActionResult<ICodeExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await CodeExam.findById(id);

    if (!exam) {
      return { success: false, error: "Code exam not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch code exam",
    };
  }
}

export async function publishCodeExam(id: string): Promise<ActionResult<ICodeExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await CodeExam.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );

    if (!exam) {
      return { success: false, error: "Code exam not found" };
    }

    revalidatePath("/admin/code-exams");
    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish code exam",
    };
  }
}

export async function getCodeSubmissions(examId: string): Promise<ActionResult<any[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submissions = await CodeSubmission.find({ examId })
      .populate("studentId", "name username")
      .sort({ submittedAt: -1 });

    return { success: true, data: JSON.parse(JSON.stringify(submissions)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch submissions",
    };
  }
}

export interface SubmitCodeExamInput {
  examId: string;
  submittedCode: string;
  timeSpent: number;
  tabSwitchCount: number;
}

export async function submitCodeExam(data: SubmitCodeExamInput): Promise<ActionResult<any>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    // Get exam to check deadline and get reference solution
    const exam = await CodeExam.findById(data.examId);
    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Check if already submitted
    const existingSubmission = await CodeSubmission.findOne({
      examId: data.examId,
      studentId: session.user.id,
    });

    if (existingSubmission && existingSubmission.submittedAt) {
      return { success: false, error: "Exam already submitted" };
    }

    const isLate = new Date() > new Date(exam.deadline);

    // Create or update submission
    let submission;
    if (existingSubmission) {
      submission = await CodeSubmission.findByIdAndUpdate(
        existingSubmission._id,
        {
          submittedCode: data.submittedCode,
          submittedAt: new Date(),
          timeSpent: data.timeSpent,
          tabSwitchCount: data.tabSwitchCount,
          isLate,
        },
        { new: true }
      );
    } else {
      submission = await CodeSubmission.create({
        examId: data.examId,
        studentId: session.user.id,
        submittedCode: data.submittedCode,
        language: exam.language,
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
      error: error instanceof Error ? error.message : "Failed to submit code exam",
    };
  }
}

export async function gradeCodeSubmission(
  submissionId: string,
  data: {
    adminScore: number;
    feedback?: string;
  }
): Promise<ActionResult<any>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submission = await CodeSubmission.findByIdAndUpdate(
      submissionId,
      {
        adminScore: data.adminScore,
        feedback: data.feedback,
        finalScore: data.adminScore, // Can be adjusted later if needed
        gradedAt: new Date(),
        gradedBy: session.user.id,
      },
      { new: true }
    );

    if (!submission) {
      return { success: false, error: "Submission not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(submission)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade submission",
    };
  }
}
