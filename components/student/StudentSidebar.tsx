"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  LayoutDashboard,
  FileQuestion,
  Code,
  BookOpen,
  Calendar,
  Trophy,
  Bot,
  LogOut,
} from "lucide-react";

interface StudentSidebarProps {
  user: {
    name: string;
    username: string;
    role: string;
  };
}

const sidebarItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/tests", label: "Tests", icon: FileQuestion },
  { href: "/student/code-exams", label: "Code Exams", icon: Code },
  { href: "/student/homework", label: "Homework", icon: BookOpen },
  { href: "/student/exams", label: "Monthly Exams", icon: Calendar },
  { href: "/student/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/student/ai-assistant", label: "AI Assistant", icon: Bot },
];

export function StudentSidebar({ user }: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-card border-r">
      <div className="p-6">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Student Portal</span>
        </Link>
      </div>

      <Separator />

      <ScrollArea className="flex-1 py-4">
        <nav className="px-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.username}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
