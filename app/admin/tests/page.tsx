"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTests, deleteTest, duplicateTest } from "@/actions/test.actions";
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
import { Plus, Edit, Copy, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface Test {
  _id: any;
  title: string;
  subject: string;
  questions: any[];
  timeLimit: number;
  status: string;
}

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      const result = await getTests();
      if (result.success && result.data) {
        setTests(result.data as unknown as Test[]);
      }
      setIsLoading(false);
    };
    fetchTests();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteTest(id);
      if (result.success) {
        toast.success("Test deleted successfully!");
        setTests(tests.filter((t) => t._id !== id));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete test");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const result = await duplicateTest(id);
      if (result.success) {
        toast.success("Test duplicated successfully!");
        if (result.data) {
          setTests([result.data as unknown as Test, ...tests]);
        }
        router.refresh();
      } else {
        toast.error(result.error || "Failed to duplicate test");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDuplicatingId(null);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tests</h1>
            <p className="text-muted-foreground">Manage your tests and quizzes</p>
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
          <h1 className="text-3xl font-bold">Tests</h1>
          <p className="text-muted-foreground">Manage your tests and quizzes</p>
        </div>
        <Link href="/admin/tests/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tests ({tests?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Questions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time Limit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests?.map((test) => (
                  <tr key={test._id} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium">{test.title}</td>
                    <td className="px-4 py-3 text-sm">{test.subject}</td>
                    <td className="px-4 py-3 text-sm">{test.questions.length}</td>
                    <td className="px-4 py-3 text-sm">{test.timeLimit} min</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(test.status)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        <Link href={`/admin/tests/${test._id}/results`}>
                          <Button variant="ghost" size="sm" title="View Results">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/tests/${test._id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Duplicate"
                          disabled={duplicatingId === test._id}
                          onClick={() => handleDuplicate(test._id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Test</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{test.title}</strong>?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(test._id)}
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
                {(!tests || tests.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No tests found. Create your first test to get started.
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
