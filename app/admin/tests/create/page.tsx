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
import { createTest } from "@/actions/test.actions";

interface Question {
  questionText: string;
  options: { label: "A" | "B" | "C" | "D"; text: string }[];
  correctAnswer: "A" | "B" | "C" | "D";
  points: number;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    subject: "",
    description: "",
    timeLimit: 30,
    deadline: "",
    passingScore: 60,
    status: "draft" as "draft" | "active",
  });

  // Step 2: Questions
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      options: [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
        { label: "D", text: "" },
      ],
      correctAnswer: "A",
      points: 1,
    },
  ]);

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBasicInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    if (field === "questionText") {
      newQuestions[index].questionText = value;
    } else if (field.startsWith("option")) {
      const optionIndex = parseInt(field.replace("option", ""));
      newQuestions[index].options[optionIndex].text = value;
    } else if (field === "correctAnswer") {
      newQuestions[index].correctAnswer = value as "A" | "B" | "C" | "D";
    } else if (field === "points") {
      newQuestions[index].points = parseInt(value) || 1;
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        options: [
          { label: "A", text: "" },
          { label: "B", text: "" },
          { label: "C", text: "" },
          { label: "D", text: "" },
        ],
        correctAnswer: "A",
        points: 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const calculateTotalPoints = () => {
    return questions.reduce((sum, q) => sum + q.points, 0);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const totalPoints = calculateTotalPoints();

      const result = await createTest({
        ...basicInfo,
        deadline: new Date(basicInfo.deadline),
        assignedTo: "all",
        questions,
        totalPoints,
      });

      if (result.success) {
        toast.success("Test created successfully!");
        router.push("/admin/tests");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create test");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return basicInfo.title && basicInfo.subject && basicInfo.deadline;
    }
    if (step === 2) {
      return questions.every(
        (q) => q.questionText && q.options.every((o) => o.text)
      );
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Test</h1>
        <p className="text-muted-foreground">Create a new test for your students</p>
      </div>

      <div className="flex gap-2 mb-6">
        <div className={`flex-1 h-2 rounded ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Step 1: Basic Information"}
            {step === 2 && "Step 2: Questions"}
            {step === 3 && "Step 3: Review & Publish"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Test Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., JavaScript Basics Quiz"
                  value={basicInfo.title}
                  onChange={handleBasicInfoChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="e.g., JavaScript"
                  value={basicInfo.subject}
                  onChange={handleBasicInfoChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the test"
                  value={basicInfo.description}
                  onChange={handleBasicInfoChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes) *</Label>
                  <Input
                    id="timeLimit"
                    name="timeLimit"
                    type="number"
                    min={1}
                    value={basicInfo.timeLimit}
                    onChange={handleBasicInfoChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    value={basicInfo.deadline}
                    onChange={handleBasicInfoChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min={0}
                    max={100}
                    value={basicInfo.passingScore}
                    onChange={handleBasicInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={basicInfo.status}
                    onValueChange={(value: "draft" | "active" | null) =>
                      setBasicInfo((prev) => ({ ...prev, status: value || "draft" }))
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
            </>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <Card key={qIndex} className="border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text *</Label>
                      <Textarea
                        placeholder="Enter your question"
                        value={question.questionText}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, "questionText", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {question.options.map((option, oIndex) => (
                        <div key={option.label} className="space-y-2">
                          <Label>Option {option.label}</Label>
                          <Input
                            placeholder={`Option ${option.label}`}
                            value={option.text}
                            onChange={(e) =>
                              handleQuestionChange(qIndex, `option${oIndex}`, e.target.value)
                            }
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select
                          value={question.correctAnswer}
                          onValueChange={(value) =>
                            handleQuestionChange(qIndex, "correctAnswer", value || "A")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min={1}
                          value={question.points}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, "points", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addQuestion} className="w-full">
                + Add Question
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Summary</h3>
                <p><strong>Title:</strong> {basicInfo.title}</p>
                <p><strong>Subject:</strong> {basicInfo.subject}</p>
                <p><strong>Time Limit:</strong> {basicInfo.timeLimit} minutes</p>
                <p><strong>Total Questions:</strong> {questions.length}</p>
                <p><strong>Total Points:</strong> {calculateTotalPoints()}</p>
                <p><strong>Passing Score:</strong> {basicInfo.passingScore}%</p>
                <p><strong>Status:</strong> {basicInfo.status}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Questions Preview</h3>
                {questions.map((q, i) => (
                  <div key={i} className="border p-3 rounded">
                    <p className="font-medium">{i + 1}. {q.questionText}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Correct: {q.correctAnswer} | Points: {q.points}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push("/admin/tests")}
              >
                Cancel
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="ml-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="ml-auto"
              >
                {isLoading ? "Creating..." : "Create Test"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
