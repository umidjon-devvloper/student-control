"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getActiveMonthlyExamsForStudent } from "@/actions/monthly-exam.actions";
import Link from "next/link";
import { Calendar, Clock, FileText, Play, Upload } from "lucide-react";

interface MonthlyExam {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  requirements: string;
  maxScore: number;
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<MonthlyExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const result = await getActiveMonthlyExamsForStudent();
        if (result.success && result.data) {
          setExams(result.data as unknown as MonthlyExam[]);
        }
      } catch (error) {
        toast.error("Failed to fetch exams");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const getExamStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: "Upcoming", variant: "secondary" as const };
    } else if (now > end) {
      return { label: "Ended", variant: "destructive" as const };
    } else {
      return { label: "Active", variant: "default" as const };
    }
  };

  const formatTimeLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monthly Exams</h1>
          <p className="text-muted-foreground">View and submit monthly project exams</p>
        </div>
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
      <div>
        <h1 className="text-3xl font-bold">Monthly Exams</h1>
        <p className="text-muted-foreground">View and submit monthly project exams</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Monthly Exams ({exams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No monthly exam announced at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const status = getExamStatus(exam.startDate, exam.endDate);
                return (
                  <div
                    key={exam._id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{exam.description}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          Max {exam.maxScore} points
                        </span>
                        {status.label === "Active" && (
                          <Badge className="bg-green-500">{formatTimeLeft(exam.endDate)}</Badge>
                        )}
                      </div>
                    </div>
                    {status.label === "Active" && (
                      <Link href={`/student/exams/${exam._id}`}>
                        <Button className="gap-2">
                          <Upload className="w-4 h-4" />
                          Submit Project
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
