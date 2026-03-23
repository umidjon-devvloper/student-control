"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHomework, deleteHomework } from "@/actions/homework.actions";
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

interface Homework {
  _id: string;
  title: string;
  type: string;
  questions: any[];
  deadline: string;
}

export default function HomeworkPage() {
  const router = useRouter();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomework = async () => {
      const result = await getHomework();
      if (result.success && result.data) {
        setHomeworkList(result.data as unknown as Homework[]);
      }
      setIsLoading(false);
    };
    fetchHomework();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteHomework(id);
      if (result.success) {
        toast.success("Homework deleted successfully!");
        setHomeworkList(homeworkList.filter((h) => h._id !== id));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete homework");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Homework</h1>
            <p className="text-muted-foreground">Manage homework assignments</p>
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
          <h1 className="text-3xl font-bold">Homework</h1>
          <p className="text-muted-foreground">Manage homework assignments</p>
        </div>
        <Link href="/admin/homework/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Homework
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Homework ({homeworkList?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Questions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Deadline</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {homeworkList?.map((homework) => (
                  <tr key={homework._id} className="border-t">
                    <td className="px-4 py-3 text-sm font-medium">{homework.title}</td>
                    <td className="px-4 py-3 text-sm">{getTypeBadge(homework.type)}</td>
                    <td className="px-4 py-3 text-sm">{homework.questions.length}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(homework.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        <Link href={`/admin/homework/${homework._id}/submissions`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/homework/${homework._id}/edit`}>
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
                              <AlertDialogTitle>Delete Homework</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{homework.title}</strong>?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(homework._id)}
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
                {(!homeworkList || homeworkList.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No homework assignments yet. Create your first assignment to get started.
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
