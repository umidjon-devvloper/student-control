import { getStudentStats } from "@/actions/dashboard.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  BookOpen,
  Code,
  TrendingUp,
  Trophy,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Target,
  TrendingDown,
  Minus,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const result = await getStudentStats();
  const stats = result.success ? result.data : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress and upcoming assignments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingTests || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Homework</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingHomework || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Exams</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.codeExamsAvailable || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgScore || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      {stats?.dailyProgress && stats.dailyProgress.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Progress ({stats.dailyProgress.date})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stats.dailyProgress.completed} of {stats.dailyProgress.total} tasks completed
              </span>
              <span className="text-sm font-medium">
                {Math.round((stats.dailyProgress.completed / stats.dailyProgress.total) * 100)}%
              </span>
            </div>
            <Progress 
              value={(stats.dailyProgress.completed / stats.dailyProgress.total) * 100} 
              className="h-2"
            />
            <div className="space-y-2">
              {stats.dailyProgress.tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {task.type}
                      </Badge>
                    </div>
                  </div>
                  {task.score !== undefined && (
                    <span className="text-sm font-medium text-green-600">
                      {task.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Summary */}
      {stats?.monthlySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Monthly Summary - {stats.monthlySummary.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{stats.monthlySummary.completedTasks}</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{stats.monthlySummary.averageScore}%</p>
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{stats.monthlySummary.bestScore}%</p>
                <p className="text-xs text-muted-foreground">Best Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold">{stats.monthlySummary.improvement > 0 ? "+" : ""}{stats.monthlySummary.improvement}%</p>
                  {stats.monthlySummary.improvement > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : stats.monthlySummary.improvement < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">vs Last Month</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold">{stats.monthlySummary.testsTaken}</p>
                <p className="text-xs text-muted-foreground">Tests</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{stats.monthlySummary.homeworkCompleted}</p>
                <p className="text-xs text-muted-foreground">Homework</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{stats.monthlySummary.codeExamsCompleted}</p>
                <p className="text-xs text-muted-foreground">Code Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/student/tests">
            <Button>View Tests</Button>
          </Link>
          <Link href="/student/homework">
            <Button variant="outline">View Homework</Button>
          </Link>
          <Link href="/student/code-exams">
            <Button variant="outline">View Code Exams</Button>
          </Link>
          <Link href="/student/leaderboard">
            <Button variant="outline">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{submission.title}</p>
                    <p className="text-sm text-muted-foreground">{submission.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{submission.score}%</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No submissions yet. Complete your first assignment to see it here!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
