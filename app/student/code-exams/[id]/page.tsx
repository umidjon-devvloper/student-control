"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getCodeExamById, submitCodeExam, getStudentAttempts } from "@/actions/code-exam.actions";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle, Lightbulb, Play, Send, RotateCcw } from "lucide-react";

interface CodeExam {
  _id: string;
  title: string;
  description?: string;
  language: string;
  taskDescription: string;
  starterCode: string;
  hints: string[];
  timeLimit: number;
  maxScore: number;
}

export default function TakeCodeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<CodeExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(10);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const result = await getCodeExamById(examId);
        if (result.success && result.data) {
          const examData = result.data as unknown as CodeExam;
          setExam(examData);
          setCode(examData.starterCode || "");
          setTimeLeft(examData.timeLimit * 60);
          
          // Fetch attempts
          const attemptsResult = await getStudentAttempts(examId);
          if (attemptsResult.success && attemptsResult.data !== undefined) {
            setAttempts(attemptsResult.data);
          }
        } else {
          toast.error("Code exam not found");
          router.push("/student/code-exams");
        }
      } catch (error) {
        toast.error("Failed to fetch code exam");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId, router]);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  // Tab switch detection - STRICT MODE
  useEffect(() => {
    if (!hasStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        // Auto-submit on tab switch
        toast.error("Tab switching detected! Your exam has been submitted.");
        handleSubmit();
      }
    };

    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Alt+Tab, Ctrl+Tab, etc.
      if (e.altKey || (e.ctrlKey && e.key === "Tab")) {
        e.preventDefault();
        toast.error("Tab switching is not allowed during the exam!");
        return false;
      }
      // Block F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("Developer tools are disabled during the exam!");
        return false;
      }
      // Block Ctrl+Shift+I/J/C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault();
        toast.error("Developer tools are disabled during the exam!");
        return false;
      }
    };

    // Prevent context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Right click is disabled during the exam!");
      return false;
    };

    // Prevent window blur
    const handleBlur = () => {
      setTabSwitchCount((prev) => prev + 1);
      toast.error("Window focus lost! Your exam has been submitted.");
      handleSubmit();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("blur", handleBlur);
    };
  }, [hasStarted, examId, code, timeLeft, tabSwitchCount]);

  const handleStart = () => {
    // Check if max attempts reached
    if (attempts >= maxAttempts) {
      toast.error(`Siz ${maxAttempts} ta urinishdan foydalandingiz. Urinishlar tugadi!`);
      return;
    }
    setHasStarted(true);
    toast.success("Code exam boshlandi! Omad!");
  };

  // Check code before submitting
  const handleCheckCode = async () => {
    if (!code.trim()) {
      toast.error("Avval kod yozing!");
      return;
    }
    
    setIsChecking(true);
    setCheckResult(null);
    
    try {
      // Simulate code checking (you can replace this with actual code validation)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Basic validation - check if code has required elements
      const hasRequiredElements = checkCodeValidity(code, exam?.language || "");
      
      if (hasRequiredElements) {
        setCheckResult({
          success: true,
          message: "Kod to'g'ri yozilgan! Yuborishingiz mumkin."
        });
        toast.success("Kod tekshirildi - to'g'ri!");
      } else {
        setCheckResult({
          success: false,
          message: "Kodda xatolik bor. Iltimos, tekshirib qayta urinib ko'ring."
        });
        toast.error("Kodda xatolik aniqlandi!");
      }
    } catch (error) {
      toast.error("Kodni tekshirishda xatolik");
    } finally {
      setIsChecking(false);
    }
  };

  // Basic code validation function
  const checkCodeValidity = (code: string, language: string): boolean => {
    // Remove comments and whitespace for basic checks
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
    
    if (!cleanCode || cleanCode.length < 10) {
      return false;
    }
    
    // Language-specific checks
    switch (language.toLowerCase()) {
      case 'html':
        // Check for basic HTML structure
        return cleanCode.includes('<') && cleanCode.includes('>');
      case 'css':
        // Check for CSS rules
        return cleanCode.includes('{') && cleanCode.includes('}');
      case 'javascript':
      case 'js':
        // Check for JS syntax
        return cleanCode.includes('function') || cleanCode.includes('const') || cleanCode.includes('let') || cleanCode.includes('var');
      case 'python':
        // Check for Python syntax
        return cleanCode.includes('def') || cleanCode.includes('print') || cleanCode.includes('import');
      default:
        return cleanCode.length > 20;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Check attempts limit
    if (attempts >= maxAttempts) {
      toast.error(`Siz ${maxAttempts} ta urinishdan foydalandingiz. Urinishlar tugadi!`);
      return;
    }
    
    setIsSubmitting(true);

    try {
      const timeSpent = exam ? exam.timeLimit * 60 - timeLeft : 0;

      const result = await submitCodeExam({
        examId,
        submittedCode: code,
        timeSpent,
        tabSwitchCount,
      });

      if (result.success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        toast.success(`Kod yuborildi! Urinish: ${newAttempts}/${maxAttempts}`);
        
        if (newAttempts >= maxAttempts) {
          toast.error("Bu sizning oxirgi urinishingiz edi.");
        }
        
        router.push("/student/code-exams");
      } else {
        toast.error(result.error || "Kod yuborishda xatolik");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      javascript: "JavaScript",
      python: "Python",
      html: "HTML",
      css: "CSS",
    };
    return labels[lang] || lang;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Yuklanmoqda...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam) return null;

  // Start screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/student/code-exams">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Code Exam larga qaytish
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{exam.title}</CardTitle>
              <Badge className="bg-blue-500">{getLanguageLabel(exam.language)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{exam.description}</p>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Til:</span>
                <span className="font-medium">{getLanguageLabel(exam.language)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vaqt limiti:</span>
                <span className="font-medium">{exam.timeLimit} daqiqa</span>
              </div>
              <div className="flex justify-between">
                <span>Maksimal ball:</span>
                <span className="font-medium">{exam.maxScore} ball</span>
              </div>
              <div className="flex justify-between">
                <span>Urinishlar:</span>
                <span className={`font-medium ${attempts >= maxAttempts ? 'text-red-500' : 'text-green-500'}`}>
                  {attempts} / {maxAttempts}
                </span>
              </div>
            </div>
            
            {attempts >= maxAttempts && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <p className="text-red-500 font-medium text-center">
                  ⚠️ Siz {maxAttempts} ta urinishdan foydalandingiz. Urinishlar tugadi!
                </p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Muhim qoidalar:</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li>Imtihon davomida tab yoki oynani almashtirmang</li>
                    <li>Tab almashtirish qayd etiladi va bahoga ta'sir qilishi mumkin</li>
                    <li>Vaqt tugaganda imtihon avtomatik yuboriladi</li>
                    <li>Sizda {maxAttempts} ta urinish imkoniyati bor</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStart}
              className="w-full gap-2"
              size="lg"
              disabled={attempts >= maxAttempts}
            >
              <Play className="w-4 h-4" />
              {attempts >= maxAttempts ? "Urinishlar tugadi" : "Code Exam ni boshlash"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/student/code-exams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">{getLanguageLabel(exam.language)}</p>
          </div>
        </div>
        <Badge
          variant={timeLeft < 300 ? "destructive" : "secondary"}
          className="text-lg px-4 py-2"
        >
          <Clock className="w-4 h-4 mr-2" />
          {formatTime(timeLeft)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Task Description */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vazifa tavsifi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{exam.taskDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          {exam.hints && exam.hints.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowHints(!showHints)}
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Maslahatlar ({exam.hints.length})
                  </span>
                  <span>{showHints ? "Yashirish" : "Ko'rsatish"}</span>
                </Button>
              </CardHeader>
              {showHints && (
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {exam.hints.map((hint, index) => (
                      <li key={index} className="text-muted-foreground">
                        {hint}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}
          
          {/* Attempts info */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Urinishlar:</span>
                <Badge variant={attempts >= maxAttempts - 2 ? "destructive" : "secondary"}>
                  {attempts} / {maxAttempts}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Code Editor */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Sizning yechimingiz</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[400px] resize-none"
              placeholder="Kodni shu yerga yozing..."
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Check result message */}
      {checkResult && (
        <div className={`p-4 rounded-lg ${checkResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <p className={`text-center font-medium ${checkResult.success ? 'text-green-500' : 'text-red-500'}`}>
            {checkResult.message}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckCode}
            disabled={isChecking || !code.trim()}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? "Tekshirilmoqda..." : "Kodni tekshirish"}
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !code.trim() || attempts >= maxAttempts}
          size="lg"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Yuborilmoqda..." : attempts >= maxAttempts ? "Urinishlar tugadi" : "Yechimni yuborish"}
        </Button>
      </div>
    </div>
  );
}
