"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getCodeExamById, submitCodeExam } from "@/actions/code-exam.actions";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle, Lightbulb, Play, Send } from "lucide-react";

interface CodeExam {
  _id: string;
  title: string;
  description?: string;
  language: string;
  taskDescription: string;
  starterCode: string;
  hints: string[];
  timeLimit: number;
  maxScore: number;
}

export default function TakeCodeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<CodeExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const result = await getCodeExamById(examId);
        if (result.success && result.data) {
          const examData = result.data as unknown as CodeExam;
          setExam(examData);
          setCode(examData.starterCode || "");
          setTimeLeft(examData.timeLimit * 60);
        } else {
          toast.error("Code exam not found");
          router.push("/student/code-exams");
        }
      } catch (error) {
        toast.error("Failed to fetch code exam");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId, router]);

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
        toast.error("Tab switching detected! Your exam has been submitted.");
        handleSubmit();
      }
    };

    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Alt+Tab, Ctrl+Tab, etc.
      if (e.altKey || (e.ctrlKey && e.key === "Tab")) {
        e.preventDefault();
        toast.error("Tab switching is not allowed during the exam!");
        return false;
      }
      // Block F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("Developer tools are disabled during the exam!");
        return false;
      }
      // Block Ctrl+Shift+I/J/C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault();
        toast.error("Developer tools are disabled during the exam!");
        return false;
      }
    };

    // Prevent context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Right click is disabled during the exam!");
      return false;
    };

    // Prevent window blur
    const handleBlur = () => {
      setTabSwitchCount((prev) => prev + 1);
      toast.error("Window focus lost! Your exam has been submitted.");
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
  }, [hasStarted, examId, code, timeLeft, tabSwitchCount]);

  const handleStart = () => {
    setHasStarted(true);
    toast.success("Code exam started! Good luck!");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const timeSpent = exam ? exam.timeLimit * 60 - timeLeft : 0;

      const result = await submitCodeExam({
        examId,
        submittedCode: code,
        timeSpent,
        tabSwitchCount,
      });

      if (result.success) {
        toast.success("Code submitted successfully!");
        router.push("/student/code-exams");
      } else {
        toast.error(result.error || "Failed to submit code");
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

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      javascript: "JavaScript",
      python: "Python",
      html: "HTML",
      css: "CSS",
    };
    return labels[lang] || lang;
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

  if (!exam) return null;

  // Start screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/student/code-exams">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Code Exams
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{exam.title}</CardTitle>
              <Badge className="bg-blue-500">{getLanguageLabel(exam.language)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{exam.description}</p>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Language:</span>
                <span className="font-medium">{getLanguageLabel(exam.language)}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span className="font-medium">{exam.timeLimit} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Max Score:</span>
                <span className="font-medium">{exam.maxScore} points</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Important Rules:</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li>Do not switch tabs or windows during the exam</li>
                    <li>Tab switching will be recorded and may affect your score</li>
                    <li>The exam will auto-submit when time runs out</li>
                    <li>Your code will be reviewed by AI for quality</li>
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
              Start Code Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/student/code-exams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">{getLanguageLabel(exam.language)}</p>
          </div>
        </div>
        <Badge
          variant={timeLeft < 300 ? "destructive" : "secondary"}
          className="text-lg px-4 py-2"
        >
          <Clock className="w-4 h-4 mr-2" />
          {formatTime(timeLeft)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Task Description */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{exam.taskDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          {exam.hints && exam.hints.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowHints(!showHints)}
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Hints ({exam.hints.length})
                  </span>
                  <span>{showHints ? "Hide" : "Show"}</span>
                </Button>
              </CardHeader>
              {showHints && (
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {exam.hints.map((hint, index) => (
                      <li key={index} className="text-muted-foreground">
                        {hint}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Right side - Code Editor */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Your Solution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[400px] resize-none"
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !code.trim()}
          size="lg"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting..." : "Submit Solution"}
        </Button>
      </div>
    </div>
  );
}
