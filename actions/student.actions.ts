"use server";

import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import User, { IUser } from "@/models/User";
import { ActionResult } from "./auth.actions";

export interface CreateStudentInput {
  name: string;
  username: string;
  password: string;
  parentPhone?: string;
  telegramChatId?: string;
  parentTelegramChatId?: string;
}

export interface UpdateStudentInput {
  name?: string;
  username?: string;
  password?: string;
  parentPhone?: string;
  telegramChatId?: string;
  parentTelegramChatId?: string;
}

export async function createStudent(
  data: CreateStudentInput
): Promise<ActionResult<IUser>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    // Check if username already exists
    const existingUser = await User.findOne({ username: data.username });
    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const student = await User.create({
      ...data,
      password: hashedPassword,
      role: "student",
    });

    revalidatePath("/admin/students");
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create student",
    };
  }
}

export async function updateStudent(
  id: string,
  data: UpdateStudentInput
): Promise<ActionResult<IUser>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    // Check if username is being changed and if it already exists
    if (data.username) {
      const existingUser = await User.findOne({
        username: data.username,
        _id: { $ne: id },
      });
      if (existingUser) {
        return { success: false, error: "Username already exists" };
      }
    }

    // Hash password if provided
    const updateData = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const student = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    revalidatePath("/admin/students");
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update student",
    };
  }
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const student = await User.findByIdAndDelete(id);

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete student",
    };
  }
}

export async function getStudents(): Promise<ActionResult<IUser[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    return { success: true, data: JSON.parse(JSON.stringify(students)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
}

export async function getStudentById(id: string): Promise<ActionResult<IUser>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Students can only view their own profile
    if (session.user.role === "student" && session.user.id !== id) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const student = await User.findById(id).select("-password");

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student",
    };
  }
}

export async function updateStudentTelegramChatIds(
  studentId: string,
  data: {
    telegramChatId?: string;
    parentTelegramChatId?: string;
  }
): Promise<ActionResult<IUser>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();

    const updateData: Record<string, string | undefined> = {};
    if (data.telegramChatId !== undefined) {
      updateData.telegramChatId = data.telegramChatId || undefined;
    }
    if (data.parentTelegramChatId !== undefined) {
      updateData.parentTelegramChatId = data.parentTelegramChatId || undefined;
    }

    const student = await User.findByIdAndUpdate(
      studentId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    revalidatePath("/admin/telegram");
    return { success: true, data: JSON.parse(JSON.stringify(student)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update chat IDs",
    };
  }
}
