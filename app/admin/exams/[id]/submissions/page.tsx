"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMonthlyExamById, getMonthlyExamSubmissions } from "@/actions/monthly-exam.actions";
import Link from "next/link";
import { ArrowLeft, Download, Eye, ExternalLink } from "lucide-react";

interface MonthlyExam {
  _id: string;
  title: string;
  maxScore: number;
}

interface Submission {
  _id: string;
  studentId: {
    name: string;
    username: string;
  };
  zipUrl?: string;
  githubLink?: string;
  description?: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
  isLate: boolean;
  gradedAt?: string;
}

export default function MonthlyExamSubmissionsPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<MonthlyExam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examResult, submissionsResult] = await Promise.all([
          getMonthlyExamById(examId),
          getMonthlyExamSubmissions(examId),
        ]);

        if (examResult.success && examResult.data) {
          setExam(examResult.data as unknown as MonthlyExam);
        }

        if (submissionsResult.success && submissionsResult.data) {
          setSubmissions(submissionsResult.data as unknown as Submission[]);
        }
      } catch (error) {
        toast.error("Failed to fetch submissions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const calculateStats = () => {
    if (submissions.length === 0) return null;

    const gradedSubmissions = submissions.filter((s) => s.score !== undefined);
    const totalSubmissions = submissions.length;
    const averageScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
      : 0;

    return {
      totalSubmissions,
      gradedCount: gradedSubmissions.length,
      pendingCount: totalSubmissions - gradedSubmissions.length,
      averageScore: Math.round(averageScore),
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
        <Link href="/admin/exams">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exams
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Project Submissions</h1>
          <p className="text-muted-foreground">{exam?.title}</p>
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
              <CardTitle className="text-sm font-medium">Graded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.gradedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}</div>
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Submission</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Submitted</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
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
                      {submission.githubLink && (
                        <a
                          href={submission.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {submission.zipUrl && (
                        <a
                          href={submission.zipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          ZIP File <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {!submission.githubLink && !submission.zipUrl && "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {submission.score !== undefined ? (
                        <span className="font-medium">{submission.score} / {exam?.maxScore}</span>
                      ) : (
                        <Badge variant="outline">Not Graded</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {submission.isLate ? (
                        <Badge variant="destructive">Late</Badge>
                      ) : (
                        <Badge className="bg-green-500">On Time</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/admin/exams/${examId}/submissions/${submission._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
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
