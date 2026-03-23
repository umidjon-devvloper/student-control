"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getMonthlyExamById, updateMonthlyExam } from "@/actions/monthly-exam.actions";

export default function EditMonthlyExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    requirements: "",
    maxScore: 100,
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const result = await getMonthlyExamById(examId);
        if (result.success && result.data) {
          const exam = result.data as any;
          setFormData({
            title: exam.title || "",
            description: exam.description || "",
            startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : "",
            endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : "",
            requirements: exam.requirements || "",
            maxScore: exam.maxScore || 100,
          });
        } else {
          toast.error("Exam not found");
          router.push("/admin/exams");
        }
      } catch (error) {
        toast.error("Failed to fetch exam");
      } finally {
        setIsFetching(false);
      }
    };

    fetchExam();
  }, [examId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateMonthlyExam(examId, {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });

      if (result.success) {
        toast.success("Exam updated successfully!");
        router.push("/admin/exams");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update exam");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Monthly Exam</h1>
        <p className="text-muted-foreground">Update monthly project exam information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., January Monthly Project"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the exam"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                name="requirements"
                placeholder="Detailed requirements for the project"
                value={formData.requirements}
                onChange={handleChange}
                rows={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxScore">Max Score</Label>
              <Input
                id="maxScore"
                name="maxScore"
                type="number"
                min={1}
                value={formData.maxScore}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/exams")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Updating..." : "Update Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
