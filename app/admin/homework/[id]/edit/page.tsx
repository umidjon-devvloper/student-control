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
import { getHomeworkById, updateHomework } from "@/actions/homework.actions";

interface Question {
  text: string;
  type: "text" | "code";
  points?: number;
}

export default function EditHomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "review" as "review" | "code" | "mixed",
    deadline: "",
    starterCode: "",
    maxScore: 100,
    passingScore: 60,
  });
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "text" as "text" | "code" },
  ]);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const result = await getHomeworkById(homeworkId);
        if (result.success && result.data) {
          const homework = result.data as any;
          setFormData({
            title: homework.title || "",
            description: homework.description || "",
            type: homework.type || "review",
            deadline: homework.deadline ? new Date(homework.deadline).toISOString().slice(0, 16) : "",
            starterCode: homework.starterCode || "",
            maxScore: homework.maxScore || 100,
            passingScore: homework.passingScore || 60,
          });
          if (homework.questions && homework.questions.length > 0) {
            setQuestions(homework.questions);
          }
        } else {
          toast.error("Homework not found");
          router.push("/admin/homework");
        }
      } catch (error) {
        toast.error("Failed to fetch homework");
      } finally {
        setIsFetching(false);
      }
    };

    fetchHomework();
  }, [homeworkId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateHomework(homeworkId, {
        ...formData,
        deadline: new Date(formData.deadline),
        questions,
      });

      if (result.success) {
        toast.success("Homework updated successfully!");
        router.push("/admin/homework");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update homework");
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

  const handleQuestionChange = (index: number, field: string, value: string | number) => {
    const newQuestions = [...questions];
    if (field === "points") {
      newQuestions[index].points = Number(value);
    } else {
      (newQuestions[index] as any)[field] = value;
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "text" }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
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
        <h1 className="text-3xl font-bold">Edit Homework</h1>
        <p className="text-muted-foreground">Update homework information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Homework Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Week 3 Review Questions"
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
                placeholder="Brief description of the homework"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
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

            {(formData.type === "code" || formData.type === "mixed") && (
              <div className="space-y-2">
                <Label htmlFor="starterCode">Starter Code</Label>
                <Textarea
                  id="starterCode"
                  name="starterCode"
                  placeholder="Initial code provided to students"
                  value={formData.starterCode}
                  onChange={handleChange}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

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

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeQuestion(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    placeholder="Enter your question"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(index, "text", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => handleQuestionChange(index, "type", value || "text")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min={1}
                      value={question.points}
                      onChange={(e) => handleQuestionChange(index, "points", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
              + Add Question
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/homework")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Updating..." : "Update Homework"}
          </Button>
        </div>
      </form>
    </div>
  );
}
