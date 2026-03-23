"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getCodeExamById, updateCodeExam } from "@/actions/code-exam.actions";

export default function EditCodeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "javascript" as "javascript" | "python" | "html" | "css",
    taskDescription: "",
    starterCode: "",
    referenceSolution: "",
    hints: "" as string,
    timeLimit: 60,
    deadline: "",
    maxScore: 100,
    passingScore: 60,
    status: "draft" as "draft" | "active" | "closed",
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const result = await getCodeExamById(examId);
        if (result.success && result.data) {
          const exam = result.data as any;
          setFormData({
            title: exam.title || "",
            description: exam.description || "",
            language: exam.language || "javascript",
            taskDescription: exam.taskDescription || "",
            starterCode: exam.starterCode || "",
            referenceSolution: exam.referenceSolution || "",
            hints: exam.hints ? exam.hints.join("\n") : "",
            timeLimit: exam.timeLimit || 60,
            deadline: exam.deadline ? new Date(exam.deadline).toISOString().slice(0, 16) : "",
            maxScore: exam.maxScore || 100,
            passingScore: exam.passingScore || 60,
            status: exam.status || "draft",
          });
        } else {
          toast.error("Code exam not found");
          router.push("/admin/code-exams");
        }
      } catch (error) {
        toast.error("Failed to fetch code exam");
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
      const result = await updateCodeExam(examId, {
        ...formData,
        deadline: new Date(formData.deadline),
        hints: formData.hints.split("\n").filter((h) => h.trim()),
      });

      if (result.success) {
        toast.success("Code exam updated successfully!");
        router.push("/admin/code-exams");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update code exam");
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
        <h1 className="text-3xl font-bold">Edit Code Exam</h1>
        <p className="text-muted-foreground">Update code exam information</p>
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
                placeholder="e.g., JavaScript Functions Challenge"
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
                <Label htmlFor="language">Programming Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, language: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Task Description *</Label>
              <Textarea
                id="taskDescription"
                name="taskDescription"
                placeholder="Detailed description of what students need to do"
                value={formData.taskDescription}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starterCode">Starter Code (Incomplete Code for Students)</Label>
              <Textarea
                id="starterCode"
                name="starterCode"
                placeholder="Initial incomplete code that students will complete"
                value={formData.starterCode}
                onChange={handleChange}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceSolution">Reference Solution (Correct Answer)</Label>
              <Textarea
                id="referenceSolution"
                name="referenceSolution"
                placeholder="The complete correct solution for comparison and grading"
                value={formData.referenceSolution}
                onChange={handleChange}
                rows={8}
                className="font-mono text-sm border-green-500/30"
              />
              <p className="text-xs text-muted-foreground">
                This solution will be used to compare with student submissions for grading
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hints">Hints (one per line)</Label>
              <Textarea
                id="hints"
                name="hints"
                placeholder="Hint 1&#10;Hint 2&#10;Hint 3"
                value={formData.hints}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  min={1}
                  value={formData.timeLimit}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  name="passingScore"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.passingScore}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/code-exams")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Updating..." : "Update Code Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
