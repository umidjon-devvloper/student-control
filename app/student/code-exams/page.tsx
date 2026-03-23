"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getActiveCodeExamsForStudent } from "@/actions/code-exam.actions";
import Link from "next/link";
import { Clock, Code, Play, CheckCircle } from "lucide-react";

interface CodeExam {
  _id: string;
  title: string;
  description?: string;
  language: string;
  timeLimit: number;
  deadline: string;
  maxScore: number;
  taskDescription: string;
}

export default function StudentCodeExamsPage() {
  const [exams, setExams] = useState<CodeExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const result = await getActiveCodeExamsForStudent();
        if (result.success && result.data) {
          setExams(result.data as unknown as CodeExam[]);
        }
      } catch (error) {
        toast.error("Failed to fetch code exams");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-500",
      python: "bg-blue-500",
      html: "bg-orange-500",
      css: "bg-cyan-500",
    };
    return colors[language] || "bg-gray-500";
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
          <h1 className="text-3xl font-bold">Code Exams</h1>
          <p className="text-muted-foreground">View and complete coding exams</p>
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
        <h1 className="text-3xl font-bold">Code Exams</h1>
        <p className="text-muted-foreground">View and complete coding exams</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Code Exams ({exams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No code exams available at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam._id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      <Badge className={getLanguageColor(exam.language)}>
                        {exam.language.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.timeLimit} minutes
                      </span>
                      <span className="flex items-center gap-1">
                        <Code className="w-4 h-4" />
                        Max {exam.maxScore} points
                      </span>
                      <Badge variant="secondary">{formatTimeLeft(exam.deadline)}</Badge>
                    </div>
                  </div>
                  <Link href={`/student/code-exams/${exam._id}`}>
                    <Button className="gap-2">
                      <Play className="w-4 h-4" />
                      Start Exam
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
