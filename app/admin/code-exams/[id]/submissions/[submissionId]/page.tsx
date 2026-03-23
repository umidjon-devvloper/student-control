"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getCodeExamById, gradeCodeSubmission } from "@/actions/code-exam.actions";
import Link from "next/link";
import { ArrowLeft, Clock, User, CheckCircle, XCircle } from "lucide-react";

interface Submission {
  _id: string;
  studentId: {
    name: string;
    username: string;
  };
  submittedCode: string;
  language: string;
  submittedAt: string;
  timeSpent: number;
  tabSwitchCount: number;
  isLate: boolean;
  adminScore?: number;
  feedback?: string;
  finalScore?: number;
  gradedAt?: string;
}

interface CodeExam {
  _id: string;
  title: string;
  language: string;
  maxScore: number;
  referenceSolution?: string;
}

export default function GradeSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const submissionId = params.submissionId as string;

  const [exam, setExam] = useState<CodeExam | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exam details
        const examResult = await getCodeExamById(examId);
        console.log(examResult)
        if (examResult.success && examResult.data) {
          setExam(examResult.data as unknown as CodeExam);
        }

        // TODO: Fetch submission details - for now using mock data
        // In a real implementation, you'd create a getSubmissionById action
        const mockSubmission: Submission = {
          _id: submissionId,
          studentId: { name: "Student Name", username: "student123" },
          submittedCode: "// Student's submitted code\nfunction solution() {\n  return 'Hello World';\n}",
          language: "javascript",
          submittedAt: new Date().toISOString(),
          timeSpent: 1800,
          tabSwitchCount: 2,
          isLate: false,
        };
        setSubmission(mockSubmission);
      } catch (error) {
        toast.error("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId, submissionId]);

  const handleGrade = async () => {
    if (!grade || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await gradeCodeSubmission(submissionId, {
        adminScore: parseInt(grade),
        feedback: feedback || undefined,
      });

      if (result.success) {
        toast.success("Submission graded successfully!");
        router.push(`/admin/code-exams/${examId}/submissions`);
      } else {
        toast.error(result.error || "Failed to grade submission");
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
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam || !submission) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Submission not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGraded = submission.finalScore !== undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/code-exams/${examId}/submissions`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Grade Submission</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{submission.studentId.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{submission.studentId.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(submission.timeSpent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {submission.isLate ? (
                <Badge variant="destructive">Late</Badge>
              ) : (
                <Badge className="bg-green-500">On Time</Badge>
              )}
            </div>
            {submission.tabSwitchCount > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Tab Switches</p>
                <p className="font-medium text-yellow-500">
                  {submission.tabSwitchCount} times
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Code */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Student Solution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono">
              {submission.submittedCode}
            </pre>
          </CardContent>
        </Card>

        {/* Reference Solution */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Reference Solution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {exam.referenceSolution ? (
              <pre className="bg-green-500/5 border border-green-500/20 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono">
                {exam.referenceSolution}
              </pre>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No reference solution provided</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grading Form */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="score">Score (out of {exam.maxScore})</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={exam.maxScore}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Enter score"
                disabled={isGraded}
              />
            </div>
            {isGraded && (
              <div className="space-y-2">
                <Label>Current Score</Label>
                <div className="text-2xl font-bold">
                  {submission.finalScore} / {exam.maxScore}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to the student..."
              rows={4}
              disabled={isGraded}
            />
          </div>

          {!isGraded ? (
            <Button
              onClick={handleGrade}
              disabled={!grade || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Grade"}
            </Button>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Graded on {new Date(submission.gradedAt!).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
