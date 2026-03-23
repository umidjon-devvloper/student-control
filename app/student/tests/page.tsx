"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getActiveTestsForStudent } from "@/actions/test.actions";
import { getStudentSubmissions } from "@/actions/test-submission.actions";
import Link from "next/link";
import { Clock, CheckCircle, Play } from "lucide-react";

interface Test {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  timeLimit: number;
  deadline: string;
  totalPoints: number;
  questions: any[];
}

interface Submission {
  testId: string;
  score: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
}

export default function StudentTestsPage() {
  const [activeTests, setActiveTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsResult, submissionsResult] = await Promise.all([
          getActiveTestsForStudent(),
          getStudentSubmissions(),
        ]);

        if (testsResult.success && testsResult.data) {
          setActiveTests(testsResult.data as unknown as Test[]);
        }

        if (submissionsResult.success && submissionsResult.data) {
          setSubmissions(submissionsResult.data as unknown as Submission[]);
        }
      } catch (error) {
        toast.error("Failed to fetch tests");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSubmissionForTest = (testId: string) => {
    return submissions.find((s) => s.testId === testId);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tests</h1>
          <p className="text-muted-foreground">View and take your tests</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableTests = activeTests.filter((t) => !getSubmissionForTest(t._id));
  const completedTests = activeTests.filter((t) => getSubmissionForTest(t._id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tests</h1>
        <p className="text-muted-foreground">View and take your tests</p>
      </div>

      {/* Available Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tests ({availableTests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {availableTests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tests available at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {availableTests.map((test) => (
                <div
                  key={test._id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{test.title}</h3>
                    <p className="text-sm text-muted-foreground">{test.subject}</p>
                    {test.description && (
                      <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.timeLimit} minutes
                      </span>
                      <span className="flex items-center gap-1">
                        {test.questions.length} questions
                      </span>
                      <Badge variant="secondary">{formatTimeLeft(test.deadline)}</Badge>
                    </div>
                  </div>
                  <Link href={`/student/tests/${test._id}`}>
                    <Button className="gap-2">
                      <Play className="w-4 h-4" />
                      Start Test
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Tests ({completedTests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTests.map((test) => {
                const submission = getSubmissionForTest(test._id);
                return (
                  <div
                    key={test._id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{test.title}</h3>
                      <p className="text-sm text-muted-foreground">{test.subject}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Submitted
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {submission?.score} / {test.totalPoints}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {submission?.percentage}%
                      </div>
                      {submission?.isPassed ? (
                        <Badge className="bg-green-500">Passed</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
