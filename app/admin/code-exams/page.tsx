"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCodeExams, deleteCodeExam } from "@/actions/code-exam.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface CodeExam {
  _id: string;
  title: string;
  language: string;
  timeLimit: number;
  deadline: string;
  status: string;
}

export default function CodeExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<CodeExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      const result = await getCodeExams();
      if (result.success && result.data) {
        setExams(result.data as unknown as CodeExam[]);
      }
      setIsLoading(false);
    };
    fetchExams();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteCodeExam(id);
      if (result.success) {
        toast.success("Code exam deleted successfully!");
        setExams(exams.filter((e) => e._id !== id));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete code exam");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLanguageBadge = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-500",
      python: "bg-blue-500",
      html: "bg-orange-500",
      css: "bg-cyan-500",
    };
    return (
      <Badge className={colors[language] || "bg-gray-500"}>
        {language.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Code Exams</h1>
            <p className="text-muted-foreground">Manage coding assignments</p>
          </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Code Exams</h1>
          <p className="text-muted-foreground">Manage coding assignments</p>
        </div>
        <Link href="/admin/code-exams/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Code Exam
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Code Exams ({exams?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Language</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time Limit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Deadline</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams?.map((exam) => (
                  <tr key={exam._id} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium">{exam.title}</td>
                    <td className="px-4 py-3 text-sm">{getLanguageBadge(exam.language)}</td>
                    <td className="px-4 py-3 text-sm">{exam.timeLimit} min</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(exam.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(exam.status)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        <Link href={`/admin/code-exams/${exam._id}/submissions`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/code-exams/${exam._id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Code Exam</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{exam.title}</strong>?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(exam._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!exams || exams.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No code exams yet. Create your first coding assignment to get started.
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
