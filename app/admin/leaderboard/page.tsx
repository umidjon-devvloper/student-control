"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { getStudents } from "@/actions/student.actions";
import { toast } from "sonner";

interface StudentRanking {
  _id: string;
  name: string;
  username: string;
  totalScore: number;
  testsCompleted: number;
  rank: number;
}

export default function AdminLeaderboardPage() {
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // This is a placeholder - in a real app, you'd have a dedicated action
        // For now, we'll show students with mock scores
        const result = await getStudents();
        if (result.success && result.data) {
          const mockRankings = result.data.map((student: any, index: number) => ({
            _id: student._id,
            name: student.name,
            username: student.username,
            totalScore: Math.floor(Math.random() * 500) + 200,
            testsCompleted: Math.floor(Math.random() * 10) + 1,
            rank: index + 1,
          }));
          // Sort by score
          mockRankings.sort((a, b) => b.totalScore - a.totalScore);
          // Reassign ranks
          mockRankings.forEach((r, i) => (r.rank = i + 1));
          setRankings(mockRankings as StudentRanking[]);
        }
      } catch (error) {
        toast.error("Failed to fetch rankings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500">Gold</Badge>;
      case 2:
        return <Badge className="bg-gray-400">Silver</Badge>;
      case 3:
        return <Badge className="bg-amber-600">Bronze</Badge>;
      default:
        return <Badge variant="secondary">Top {Math.ceil(rank / 10) * 10}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">View student rankings</p>
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
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">View student rankings based on performance</p>
      </div>

      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="relative mt-8">
            <CardContent className="pt-6 text-center">
              <Medal className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="font-semibold truncate">{rankings[1]?.name}</p>
              <p className="text-sm text-muted-foreground">{rankings[1]?.totalScore} pts</p>
              <Badge className="mt-2 bg-gray-400">2nd Place</Badge>
            </CardContent>
          </Card>
          {/* 1st Place */}
          <Card className="relative border-yellow-500/50">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
              <p className="font-bold text-lg truncate">{rankings[0]?.name}</p>
              <p className="text-sm text-muted-foreground">{rankings[0]?.totalScore} pts</p>
              <Badge className="mt-2 bg-yellow-500">1st Place</Badge>
            </CardContent>
          </Card>
          {/* 3rd Place */}
          <Card className="relative mt-8">
            <CardContent className="pt-6 text-center">
              <Award className="w-12 h-12 text-amber-600 mx-auto mb-2" />
              <p className="font-semibold truncate">{rankings[2]?.name}</p>
              <p className="text-sm text-muted-foreground">{rankings[2]?.totalScore} pts</p>
              <Badge className="mt-2 bg-amber-600">3rd Place</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Rankings ({rankings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tests Completed</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((student) => (
                  <tr key={student._id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getRankIcon(student.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.username}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{student.testsCompleted}</td>
                    <td className="px-4 py-3 text-sm font-medium">{student.totalScore}</td>
                    <td className="px-4 py-3">{getRankBadge(student.rank)}</td>
                  </tr>
                ))}
                {rankings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No students found. Add students to see rankings.
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
