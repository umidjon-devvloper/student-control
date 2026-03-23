"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getStudentById, updateStudent } from "@/actions/student.actions";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    parentPhone: "",
    telegramChatId: "",
    parentTelegramChatId: "",
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const result = await getStudentById(studentId);
        if (result.success && result.data) {
          const student = result.data as any;
          setFormData({
            name: student.name || "",
            username: student.username || "",
            password: "",
            parentPhone: student.parentPhone || "",
            telegramChatId: student.telegramChatId || "",
            parentTelegramChatId: student.parentTelegramChatId || "",
          });
        } else {
          toast.error("Student not found");
          router.push("/admin/students");
        }
      } catch (error) {
        toast.error("Failed to fetch student");
      } finally {
        setIsFetching(false);
      }
    };

    fetchStudent();
  }, [studentId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only send password if it's provided
      const updateData: any = {
        name: formData.name,
        username: formData.username,
        parentPhone: formData.parentPhone,
        telegramChatId: formData.telegramChatId,
        parentTelegramChatId: formData.parentTelegramChatId,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const result = await updateStudent(studentId, updateData);

      if (result.success) {
        toast.success("Student updated successfully!");
        router.push("/admin/students");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update student");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Student</h1>
        <p className="text-muted-foreground">Update student information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter student name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentPhone">Parent Phone</Label>
              <Input
                id="parentPhone"
                name="parentPhone"
                placeholder="+998 90 123 45 67"
                value={formData.parentPhone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramChatId">Student Telegram Chat ID</Label>
              <Input
                id="telegramChatId"
                name="telegramChatId"
                placeholder="123456789"
                value={formData.telegramChatId}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentTelegramChatId">Parent Telegram Chat ID</Label>
              <Input
                id="parentTelegramChatId"
                name="parentTelegramChatId"
                placeholder="123456789"
                value={formData.parentTelegramChatId}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/students")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
