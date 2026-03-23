"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getHomeworkById } from "@/actions/homework.actions";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle, FileText, Code, Send, Play } from "lucide-react";

interface Question {
  _id: string;
  text: string;
  type: "text" | "code";
}

interface Homework {
  _id: string;
  title: string;
  description?: string;
  type: "review" | "code" | "mixed";
  questions: Question[];
  starterCode?: string;
  maxScore: number;
  deadline: string;
}

export default function TakeHomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;

  const [homework, setHomework] = useState<Homework | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const result = await getHomeworkById(homeworkId);
        if (result.success && result.data) {
          const homeworkData = result.data as unknown as Homework;
          setHomework(homeworkData);
          // Initialize answers with starter code if available
          const initialAnswers: Record<string, string> = {};
          homeworkData.questions.forEach((q) => {
            if (q.type === "code" && homeworkData.starterCode) {
              initialAnswers[q._id] = homeworkData.starterCode;
            } else {
              initialAnswers[q._id] = "";
            }
          });
          setAnswers(initialAnswers);
        } else {
          toast.error("Homework not found");
          router.push("/student/homework");
        }
      } catch (error) {
        toast.error("Failed to fetch homework");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomework();
  }, [homeworkId, router]);

  // Tab switch detection - STRICT MODE
  useEffect(() => {
    if (!hasStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        toast.error("Tab switching detected! Your homework has been submitted.");
        handleSubmit();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || (e.ctrlKey && e.key === "Tab")) {
        e.preventDefault();
        toast.error("Tab switching is not allowed during the homework!");
        return false;
      }
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("Developer tools are disabled during the homework!");
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault();
        toast.error("Developer tools are disabled during the homework!");
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Right click is disabled during the homework!");
      return false;
    };

    const handleBlur = () => {
      setTabSwitchCount((prev) => prev + 1);
      toast.error("Window focus lost! Your homework has been submitted.");
      handleSubmit();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("blur", handleBlur);
    };
  }, [hasStarted, homeworkId, answers, tabSwitchCount]);

  const handleStart = () => {
    setHasStarted(true);
    toast.success("Homework started! Good luck!");
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // TODO: Implement homework submission action
      toast.success("Homework submitted successfully!");
      router.push("/student/homework");
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "review":
        return <Badge className="bg-blue-500">Review</Badge>;
      case "code":
        return <Badge className="bg-purple-500">Code</Badge>;
      case "mixed":
        return <Badge className="bg-orange-500">Mixed</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const formatTimeLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (isLoading) {
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

  if (!homework) return null;

  // Start screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/student/homework">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Homework
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{homework.title}</CardTitle>
              {getTypeBadge(homework.type)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{homework.description}</p>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium capitalize">{homework.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Questions:</span>
                <span className="font-medium">{homework.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Score:</span>
                <span className="font-medium">{homework.maxScore} points</span>
              </div>
              <div className="flex justify-between">
                <span>Time Left:</span>
                <span className="font-medium">{formatTimeLeft(homework.deadline)}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Important:</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li>Answer all questions before submitting</li>
                    <li>Code questions support syntax highlighting</li>
                    <li>You can edit your answers until you submit</li>
                    <li>Make sure to submit before the deadline</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStart}
              className="w-full gap-2"
              size="lg"
            >
              <Play className="w-4 h-4" />
              Start Homework
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Homework in progress
  const question = homework.questions[currentQuestion];
  const progress = homework.questions.length > 0 ? ((currentQuestion + 1) / homework.questions.length) * 100 : 0;
  const allAnswered = homework.questions.every((q) => answers[q._id]?.trim());

  // Handle case where questions array is empty
  if (!question) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No questions available for this homework.</p>
            <Button onClick={() => router.push("/student/homework")} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{homework.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {homework.questions.length}
          </p>
        </div>
        <Badge variant="secondary">{formatTimeLeft(homework.deadline)}</Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Question {currentQuestion + 1}</CardTitle>
            {question.type === "code" ? (
              <Badge className="bg-purple-500">
                <Code className="w-3 h-3 mr-1" />
                Code
              </Badge>
            ) : (
              <Badge className="bg-blue-500">
                <FileText className="w-3 h-3 mr-1" />
                Text
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{question.text}</p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={answers[question._id] || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className={`min-h-[300px] resize-none ${
              question.type === "code" ? "font-mono text-sm" : ""
            }`}
            placeholder={
              question.type === "code"
                ? "Write your code here..."
                : "Write your answer here..."
            }
            spellCheck={question.type !== "code"}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        {currentQuestion < homework.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !allAnswered}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit Homework"}
          </Button>
        )}
      </div>

      {/* Question navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {homework.questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  index === currentQuestion
                    ? "bg-primary text-primary-foreground"
                    : answers[q._id]?.trim()
                    ? "bg-green-500/20 text-green-700 border border-green-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
