"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMonthlyExams, deleteMonthlyExam } from "@/actions/monthly-exam.actions";
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

interface MonthlyExam {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  maxScore: number;
}

export default function MonthlyExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<MonthlyExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      const result = await getMonthlyExams();
      if (result.success && result.data) {
        setExams(result.data as unknown as MonthlyExam[]);
      }
      setIsLoading(false);
    };
    fetchExams();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteMonthlyExam(id);
      if (result.success) {
        toast.success("Exam deleted successfully!");
        setExams(exams.filter((e) => e._id !== id));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete exam");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    if (now < new Date(startDate)) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else if (now > new Date(endDate)) {
      return <Badge variant="destructive">Ended</Badge>;
    } else {
      return <Badge className="bg-green-500">Active</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Monthly Exams</h1>
            <p className="text-muted-foreground">Manage monthly project exams</p>
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
          <h1 className="text-3xl font-bold">Monthly Exams</h1>
          <p className="text-muted-foreground">Manage monthly project exams</p>
        </div>
        <Link href="/admin/exams/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Monthly Exams ({exams?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">End Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Max Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams?.map((exam) => (
                  <tr key={exam._id} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium">{exam.title}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(exam.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(exam.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{exam.maxScore}</td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(exam.startDate, exam.endDate)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        <Link href={`/admin/exams/${exam._id}/submissions`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam._id}/edit`}>
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
                              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
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
                      No monthly exams yet. Create your first exam to get started.
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
