"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTestById } from "@/actions/test.actions";
import { getTestSubmissions } from "@/actions/test-submission.actions";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

interface Test {
  _id: string;
  title: string;
  subject: string;
  totalPoints: number;
  passingScore: number;
}

interface Submission {
  _id: string;
  studentId: {
    name: string;
    username: string;
  };
  score: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  timeSpent: number;
}

export default function TestResultsPage() {
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testResult, submissionsResult] = await Promise.all([
          getTestById(testId),
          getTestSubmissions(testId),
        ]);

        if (testResult.success && testResult.data) {
          setTest(testResult.data as unknown as Test);
        }

        if (submissionsResult.success && submissionsResult.data) {
          setSubmissions(submissionsResult.data as unknown as Submission[]);
        }
      } catch (error) {
        toast.error("Failed to fetch results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [testId]);

  const getScoreBadge = (isPassed: boolean) => {
    return isPassed ? (
      <Badge className="bg-green-500">Passed</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const calculateStats = () => {
    if (submissions.length === 0) return null;

    const totalSubmissions = submissions.length;
    const passedSubmissions = submissions.filter((s) => s.isPassed).length;
    const averageScore =
      submissions.reduce((sum, s) => sum + s.percentage, 0) / totalSubmissions;
    const highestScore = Math.max(...submissions.map((s) => s.percentage));
    const lowestScore = Math.min(...submissions.map((s) => s.percentage));

    return {
      totalSubmissions,
      passedSubmissions,
      passRate: Math.round((passedSubmissions / totalSubmissions) * 100),
      averageScore: Math.round(averageScore),
      highestScore,
      lowestScore,
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tests">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tests
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Test Results</h1>
          <p className="text-muted-foreground">{test?.title}</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highestScore}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student Submissions ({submissions.length})</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time Spent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium">
                      {submission.studentId?.name || "Unknown"}
                      <div className="text-xs text-muted-foreground">
                        {submission.studentId?.username}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {submission.score} / {test?.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-sm">{submission.percentage}%</td>
                    <td className="px-4 py-3 text-sm">
                      {getScoreBadge(submission.isPassed)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatTime(submission.timeSpent)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
