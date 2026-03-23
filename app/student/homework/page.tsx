"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getActiveHomeworkForStudent } from "@/actions/homework.actions";
import Link from "next/link";
import { Clock, FileText, Play, CheckCircle, Code } from "lucide-react";

interface Homework {
  _id: string;
  title: string;
  description?: string;
  type: "review" | "code" | "mixed";
  deadline: string;
  questions: any[];
  maxScore: number;
}

export default function StudentHomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const result = await getActiveHomeworkForStudent();
        if (result.success && result.data) {
          setHomeworkList(result.data as unknown as Homework[]);
        }
      } catch (error) {
        toast.error("Failed to fetch homework");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomework();
  }, []);

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "code":
      case "mixed":
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homework</h1>
          <p className="text-muted-foreground">View and submit your homework</p>
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
        <h1 className="text-3xl font-bold">Homework</h1>
        <p className="text-muted-foreground">View and submit your homework</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Homework ({homeworkList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {homeworkList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pending homework at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {homeworkList.map((homework) => (
                <div
                  key={homework._id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{homework.title}</h3>
                      {getTypeBadge(homework.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">{homework.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(homework.type)}
                        {homework.questions.length} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Max {homework.maxScore} points
                      </span>
                      <Badge variant="secondary">{formatTimeLeft(homework.deadline)}</Badge>
                    </div>
                  </div>
                  <Link href={`/student/homework/${homework._id}`}>
                    <Button className="gap-2">
                      <Play className="w-4 h-4" />
                      Start
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
