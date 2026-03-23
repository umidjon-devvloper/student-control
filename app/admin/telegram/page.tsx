"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStudents, updateStudentTelegramChatIds } from "@/actions/student.actions";
import { Search, Send, MessageCircle } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  username: string;
  telegramChatId?: string;
  parentTelegramChatId?: string;
}

export default function TelegramManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentChatId, setStudentChatId] = useState("");
  const [parentChatId, setParentChatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      const result = await getStudents();
      if (result.success && result.data) {
        const studentData = result.data as unknown as Student[];
        setStudents(studentData);
        setFilteredStudents(studentData);
      }
    } catch (error) {
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student._id);
    setStudentChatId(student.telegramChatId || "");
    setParentChatId(student.parentTelegramChatId || "");
  };

  const handleSave = async (studentId: string) => {
    setIsSaving(true);
    try {
      const result = await updateStudentTelegramChatIds(studentId, {
        telegramChatId: studentChatId || undefined,
        parentTelegramChatId: parentChatId || undefined,
      });

      if (result.success) {
        toast.success("Chat ID lar muvaffaqiyatli yangilandi!");
        setEditingId(null);
        fetchStudents();
      } else {
        toast.error(result.error || "Yangilashda xatolik");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setStudentChatId("");
    setParentChatId("");
  };

  const handleTestMessage = async (chatId: string, type: "student" | "parent") => {
    if (!chatId) {
      toast.error("Avval Chat ID kiriting");
      return;
    }

    try {
      const { sendTelegramMessage } = await import("@/lib/telegram");
      const success = await sendTelegramMessage({
        chatId,
        text: `🧪 <b>Sinov Xabari</b>\n\nBu Student Control tizimidan sinov xabari.\n\nAgar bu xabarni oldingiz, ${type === "student" ? "o'quvchi" : "ota-ona"} bildirishnomalari to'g'ri sozlangan! ✅`,
      });

      
      if (success) {
        toast.success("Sinov xabari yuborildi!");
      } else {
        toast.error("Sinov xabarini yuborishda xatolik");
      }
    } catch (error) {
      toast.error("Sinov xabarini yuborishda xatolik");
    }
  };

  const getStatusBadge = (chatId?: string) => {
    if (chatId) {
      return <Badge className="bg-green-500">Ulangan</Badge>;
    }
    return <Badge variant="secondary">Sozlanmagan</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Telegram Bildirishnomalar</h1>
          <p className="text-muted-foreground">O'quvchi va ota-ona Telegram Chat ID larini boshqarish</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Yuklanmoqda...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Telegram Bildirishnomalar</h1>
        <p className="text-muted-foreground">
          Kunlik hisobotlar va eslatmalar uchun o'quvchi va ota-ona Telegram Chat ID larini boshqarish
        </p>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-500">Chat ID ni qanday olish:</p>
              <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                <li>Telegram ni oching va bot ni qidiring</li>
                <li>Bot ga <code>/start</code> xabarini yuboring</li>
                <li>Bot ga istalgan xabar yuboring</li>
                <li>
                  Tashrif buyuring: <code>https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates</code>
                </li>
                <li>&quot;chat&quot;:&#123;&quot;id&quot;:123456789&#125; ni qidiring - bu son Chat ID hisoblanadi</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="O'quvchilarni qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>O'quvchilar ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.username}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(student.telegramChatId)}
                    {getStatusBadge(student.parentTelegramChatId)}
                  </div>
                </div>

                {editingId === student._id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>O'quvchi Chat ID</Label>
                        <div className="flex gap-2">
                          <Input
                            value={studentChatId}
                            onChange={(e) => setStudentChatId(e.target.value)}
                            placeholder="masalan, 123456789"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTestMessage(studentChatId, "student")}
                            disabled={!studentChatId}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ota-ona Chat ID</Label>
                        <div className="flex gap-2">
                          <Input
                            value={parentChatId}
                            onChange={(e) => setParentChatId(e.target.value)}
                            placeholder="masalan, 987654321"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTestMessage(parentChatId, "parent")}
                            disabled={!parentChatId}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(student._id)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Bekor qilish
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">O'quvchi Chat ID:</span>
                      <p className="font-mono">{student.telegramChatId || "Sozlanmagan"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ota-ona Chat ID:</span>
                      <p className="font-mono">{student.parentTelegramChatId || "Sozlanmagan"}</p>
                    </div>
                  </div>
                )}

                {editingId !== student._id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(student)}
                  >
                    Chat ID larni tahrirlash
                  </Button>
                )}
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                O'quvchilar topilmadi.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
