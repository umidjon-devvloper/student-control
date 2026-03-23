"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTestById } from "@/actions/test.actions";
import { startTest, submitTest } from "@/actions/test-submission.actions";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";

interface Question {
  _id: string;
  questionText: string;
  options: { label: "A" | "B" | "C" | "D"; text: string }[];
  correctAnswer: "A" | "B" | "C" | "D";
  points: number;
}

interface Test {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  timeLimit: number;
  totalPoints: number;
  questions: Question[];
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const result = await getTestById(testId);
        if (result.success && result.data) {
          const testData = result.data as unknown as Test;
          setTest(testData);
          setTimeLeft(testData.timeLimit * 60);
        } else {
          toast.error("Test not found");
          router.push("/student/tests");
        }
      } catch (error) {
        toast.error("Failed to fetch test");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [testId, router]);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  // Tab switch detection - STRICT MODE
  useEffect(() => {
    if (!hasStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        // Auto-submit on tab switch
        toast.error("Tab switching detected! Your test has been submitted.");
        handleSubmit();
      }
    };

    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || (e.ctrlKey && e.key === "Tab")) {
        e.preventDefault();
        toast.error("Tab switching is not allowed during the test!");
        return false;
      }
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("Developer tools are disabled during the test!");
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault();
        toast.error("Developer tools are disabled during the test!");
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Right click is disabled during the test!");
      return false;
    };

    const handleBlur = () => {
      setTabSwitchCount((prev) => prev + 1);
      toast.error("Window focus lost! Your test has been submitted.");
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
  }, [hasStarted, testId, answers, timeLeft, tabSwitchCount]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await startTest(testId);
      if (result.success) {
        setHasStarted(true);
        toast.success("Test started! Good luck!");
      } else {
        toast.error(result.error || "Failed to start test");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswer = (questionId: string, answer: "A" | "B" | "C" | "D") => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const timeSpent = test ? test.timeLimit * 60 - timeLeft : 0;
      const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const result = await submitTest({
        testId,
        answers: answersArray,
        timeSpent,
        tabSwitchCount,
      });

      if (result.success) {
        toast.success("Test submitted successfully!");
        router.push("/student/tests");
      } else {
        toast.error(result.error || "Failed to submit test");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

  if (!test) return null;

  // Start screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/student/tests">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Tests
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{test.description}</p>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subject:</span>
                <span className="font-medium">{test.subject}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span className="font-medium">{test.timeLimit} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Questions:</span>
                <span className="font-medium">{test.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Points:</span>
                <span className="font-medium">{test.totalPoints}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Important Rules:</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li>Do not switch tabs or windows during the test</li>
                    <li>Tab switching will be recorded and may affect your score</li>
                    <li>The test will auto-submit when time runs out</li>
                    <li>You can only take this test once</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full"
              size="lg"
            >
              {isStarting ? "Starting..." : "Start Test"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test in progress
  const question = test.questions[currentQuestion];
  const progress = test.questions.length > 0 ? ((currentQuestion + 1) / test.questions.length) * 100 : 0;

  // Handle case where questions array is empty
  if (!question) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No questions available for this test.</p>
            <Button onClick={() => router.push("/student/tests")} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {test.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={timeLeft < 60 ? "destructive" : "secondary"}
            className="text-lg px-4 py-2"
          >
            <Clock className="w-4 h-4 mr-2" />
            {formatTime(timeLeft)}
          </Badge>
        </div>
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
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion + 1}. {question.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.label}
              onClick={() => handleAnswer(question._id, option.label)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                answers[question._id] === option.label
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <span className="font-medium mr-3">{option.label}.</span>
              {option.text}
            </button>
          ))}
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

        {currentQuestion < test.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            disabled={!answers[question._id]}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < test.questions.length}
            variant="default"
          >
            {isSubmitting ? "Submitting..." : "Submit Test"}
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
            {test.questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  index === currentQuestion
                    ? "bg-primary text-primary-foreground"
                    : answers[q._id]
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
