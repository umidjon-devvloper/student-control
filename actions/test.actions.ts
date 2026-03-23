"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Test, { ITest, IQuestion } from "@/models/Test";
import { ActionResult } from "./auth.actions";

export interface CreateTestInput {
  title: string;
  description?: string;
  subject: string;
  questions: IQuestion[];
  timeLimit: number;
  deadline: Date;
  assignedTo: string[] | "all";
  totalPoints: number;
  passingScore: number;
  status: "draft" | "active" | "closed";
}

export async function createTest(
  data: CreateTestInput,
): Promise<ActionResult<ITest>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const test = await Test.create({
      ...data,
      createdBy: session.user.id,
    });

    revalidatePath("/admin/tests");
    return { success: true, data: JSON.parse(JSON.stringify(test)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create test",
    };
  }
}

export async function updateTest(
  id: string,
  data: Partial<CreateTestInput>,
): Promise<ActionResult<ITest>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const test = await Test.findByIdAndUpdate(id, data, { new: true });

    if (!test) {
      return { success: false, error: "Test not found" };
    }

    revalidatePath("/admin/tests");
    return { success: true, data: JSON.parse(JSON.stringify(test)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update test",
    };
  }
}

export async function deleteTest(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    await Test.findByIdAndDelete(id);

    revalidatePath("/admin/tests");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete test",
    };
  }
}

export async function duplicateTest(id: string): Promise<ActionResult<ITest>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const originalTest = await Test.findById(id);
    if (!originalTest) {
      return { success: false, error: "Test not found" };
    }

    const duplicatedTest = await Test.create({
      ...originalTest.toObject(),
      _id: undefined,
      title: `${originalTest.title} (Copy)`,
      status: "draft",
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/admin/tests");
    return { success: true, data: JSON.parse(JSON.stringify(duplicatedTest)) };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to duplicate test",
    };
  }
}

export async function getTests(): Promise<ActionResult<ITest[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const tests = await Test.find().sort({ createdAt: -1 }).lean();
    console.log("Fetched tests from DB:", tests);
    return { success: true, data: JSON.parse(JSON.stringify(tests)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tests",
    };
  }
}

export async function getActiveTestsForStudent(): Promise<
  ActionResult<ITest[]>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const now = new Date();
    const tests = await Test.find({
      status: "active",
      deadline: { $gte: now },
      $or: [{ assignedTo: "all" }, { assignedTo: session.user.id }],
    }).sort({ deadline: 1 });

    return { success: true, data: JSON.parse(JSON.stringify(tests)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tests",
    };
  }
}

export async function getTestById(id: string): Promise<ActionResult<ITest>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const test = await Test.findById(id);

    if (!test) {
      return { success: false, error: "Test not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(test)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch test",
    };
  }
}

export async function publishTest(id: string): Promise<ActionResult<ITest>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const test = await Test.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true },
    );

    if (!test) {
      return { success: false, error: "Test not found" };
    }

    revalidatePath("/admin/tests");
    return { success: true, data: JSON.parse(JSON.stringify(test)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish test",
    };
  }
}
