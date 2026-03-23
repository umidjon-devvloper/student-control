"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Homework, { IHomework, IHomeworkQuestion } from "@/models/Homework";
import HomeworkSubmission from "@/models/HomeworkSubmission";
import { ActionResult } from "./auth.actions";

export interface CreateHomeworkInput {
  title: string;
  description?: string;
  type: "review" | "code" | "mixed";
  deadline: Date;
  assignedTo: string[] | "all";
  questions: IHomeworkQuestion[];
  starterCode?: string;
  maxScore: number;
  passingScore: number;
}

export async function createHomework(
  data: CreateHomeworkInput
): Promise<ActionResult<IHomework>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const homework = await Homework.create({
      ...data,
      createdBy: session.user.id,
    });

    revalidatePath("/admin/homework");
    return { success: true, data: JSON.parse(JSON.stringify(homework)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create homework",
    };
  }
}

export async function updateHomework(
  id: string,
  data: Partial<CreateHomeworkInput>
): Promise<ActionResult<IHomework>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const homework = await Homework.findByIdAndUpdate(id, data, { new: true });

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    revalidatePath("/admin/homework");
    return { success: true, data: JSON.parse(JSON.stringify(homework)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update homework",
    };
  }
}

export async function deleteHomework(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    await Homework.findByIdAndDelete(id);

    revalidatePath("/admin/homework");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete homework",
    };
  }
}

export async function getHomework(): Promise<ActionResult<IHomework[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const homework = await Homework.find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(homework)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homework",
    };
  }
}

export async function getActiveHomeworkForStudent(): Promise<ActionResult<IHomework[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const now = new Date();
    const homework = await Homework.find({
      deadline: { $gte: now },
      $or: [{ assignedTo: "all" }, { assignedTo: session.user.id }],
    }).sort({ deadline: 1 });

    return { success: true, data: JSON.parse(JSON.stringify(homework)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homework",
    };
  }
}

export async function getHomeworkById(id: string): Promise<ActionResult<IHomework>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const homework = await Homework.findById(id);

    if (!homework) {
      return { success: false, error: "Homework not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(homework)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homework",
    };
  }
}

export async function getHomeworkSubmissions(homeworkId: string): Promise<ActionResult<any[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const submissions = await HomeworkSubmission.find({ homeworkId })
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
