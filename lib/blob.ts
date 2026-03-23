import { put } from "@vercel/blob";

export async function uploadFile(
  file: File,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const blob = await put(`${path}/${file.name}`, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

export async function uploadZip(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    const studentId = formData.get("studentId") as string;
    const examId = formData.get("examId") as string;

    if (!file || !studentId || !examId) {
      return { success: false, error: "Missing required fields" };
    }

    if (!file.name.endsWith(".zip")) {
      return { success: false, error: "Only ZIP files are allowed" };
    }

    const path = `submissions/${examId}/${studentId}`;
    const blob = await put(`${path}/${file.name}`, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload ZIP",
    };
  }
}
