"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import MonthlyExam, { IMonthlyExam } from "@/models/MonthlyExam";
import MonthlyExamSubmission from "@/models/MonthlyExamSubmission";
import { ActionResult } from "./auth.actions";

export interface CreateMonthlyExamInput {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  requirements: string;
  maxScore: number;
}

export async function createMonthlyExam(
  data: CreateMonthlyExamInput
): Promise<ActionResult<IMonthlyExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await MonthlyExam.create({
      ...data,
      createdBy: session.user.id,
    });

    revalidatePath("/admin/exams");
    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create monthly exam",
    };
  }
}

export async function updateMonthlyExam(
  id: string,
  data: Partial<CreateMonthlyExamInput>
): Promise<ActionResult<IMonthlyExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await MonthlyExam.findByIdAndUpdate(id, data, { new: true });

    if (!exam) {
      return { success: false, error: "Monthly exam not found" };
    }

    revalidatePath("/admin/exams");
    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update monthly exam",
    };
  }
}

export async function deleteMonthlyExam(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    await MonthlyExam.findByIdAndDelete(id);

    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete monthly exam",
    };
  }
}

export async function getMonthlyExams(): Promise<ActionResult<IMonthlyExam[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exams = await MonthlyExam.find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(exams)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch monthly exams",
    };
  }
}

export async function getActiveMonthlyExamsForStudent(): Promise<ActionResult<IMonthlyExam[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const now = new Date();
    const exams = await MonthlyExam.find({
      endDate: { $gte: now },
    }).sort({ startDate: 1 });

    return { success: true, data: JSON.parse(JSON.stringify(exams)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch monthly exams",
    };
  }
}

export async function getMonthlyExamById(id: string): Promise<ActionResult<IMonthlyExam>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const exam = await MonthlyExam.findById(id);

    if (!exam) {
      return { success: false, error: "Monthly exam not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch monthly exam",
    };
  }
}

export async function getMonthlyExamSubmissions(examId: string): Promise<ActionResult<any[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submissions = await MonthlyExamSubmission.find({ examId })
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
