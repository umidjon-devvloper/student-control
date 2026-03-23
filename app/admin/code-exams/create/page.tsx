"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createCodeExam } from "@/actions/code-exam.actions";

export default function CreateCodeExamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "javascript" as "javascript" | "python" | "html" | "css",
    starterCode: "",
    referenceSolution: "",
    taskDescription: "",
    hints: "",
    timeLimit: 60,
    deadline: "",
    maxScore: 100,
    passingScore: 60,
    status: "draft" as "draft" | "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createCodeExam({
        ...formData,
        deadline: new Date(formData.deadline),
        assignedTo: "all",
        hints: formData.hints.split("\n").filter((h) => h.trim()),
        testCases: [],
      });

      if (result.success) {
        toast.success("Code exam created successfully!");
        router.push("/admin/code-exams");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create code exam");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Code Exam</h1>
        <p className="text-muted-foreground">Create a new coding assignment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., JavaScript Array Methods"
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
                <Label htmlFor="language">Language *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, language: value }))
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
                <Label htmlFor="timeLimit">Time Limit (minutes) *</Label>
                <Input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  min={1}
                  value={formData.timeLimit}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
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
                placeholder="Detailed instructions for the coding task"
                rows={6}
                value={formData.taskDescription}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starterCode">Starter Code (Incomplete Code for Students)</Label>
              <Textarea
                id="starterCode"
                name="starterCode"
                placeholder="Initial incomplete code that students will complete"
                rows={8}
                className="font-mono"
                value={formData.starterCode}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceSolution">Reference Solution (Correct Answer)</Label>
              <Textarea
                id="referenceSolution"
                name="referenceSolution"
                placeholder="The complete correct solution for comparison and grading"
                rows={8}
                className="font-mono border-green-500/30"
                value={formData.referenceSolution}
                onChange={handleChange}
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
                rows={4}
                value={formData.hints}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score *</Label>
                <Input
                  id="maxScore"
                  name="maxScore"
                  type="number"
                  min={1}
                  value={formData.maxScore}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score *</Label>
                <Input
                  id="passingScore"
                  name="passingScore"
                  type="number"
                  min={1}
                  value={formData.passingScore}
                  onChange={handleChange}
                  required
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
            {isLoading ? "Creating..." : "Create Code Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
