"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Bot, User, Lightbulb, Code, BookOpen, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "hint" | "explanation" | "guidance" | "general";
}

const AI_GUIDELINES = `
You are a helpful programming tutor. Your role is to GUIDE students, NOT to write code for them.

Rules:
1. NEVER write complete code solutions
2. Explain concepts and approaches
3. Ask guiding questions to help them think
4. Provide hints and pseudocode only
5. Encourage problem-solving
6. If they ask for direct code, redirect them to think

Response format:
- Start with encouragement
- Explain the concept
- Give hints/pseudocode
- Ask a follow-up question
`;

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Get a hint", prompt: "I need a hint to solve this problem. Don't give me the code, just guide me in the right direction." },
  { icon: BookOpen, label: "Explain concept", prompt: "Can you explain the concept I need to understand for this problem?" },
  { icon: Code, label: "Pseudocode help", prompt: "Can you give me pseudocode or algorithm steps? Not actual code." },
  { icon: Sparkles, label: "Debug approach", prompt: "My code isn't working. How should I approach debugging it?" },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hello! I'm your AI programming assistant. I'm here to help you learn and guide you through coding problems.\n\n💡 **Important:** I won't write code for you, but I'll help you understand concepts, give hints, and guide your thinking process.\n\nWhat would you like help with today?",
      type: "general",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual API call)
      const response = await getAIResponse(messageText);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        type: detectMessageType(messageText),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock AI response - replace with actual API integration
  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes("hint")) {
      return `💡 **Here's a hint:**

Think about breaking the problem into smaller steps:
1. What input are you receiving?
2. What operations do you need to perform?
3. What should the output look like?

Try to write out the steps in plain English first (pseudocode), then translate to code.

**Question for you:** What's the first step you think you need to take?`;
    }

    if (lowerMsg.includes("explain") || lowerMsg.includes("concept")) {
      return `📚 **Let me explain the concept:**

This problem involves understanding how to work with data structures. The key idea is:

- You need to iterate through the data
- Process each element according to certain rules
- Collect or transform the results

**Think about it this way:** If you were doing this manually with pen and paper, what would your process be?

Can you describe that process to me?`;
    }

    if (lowerMsg.includes("pseudocode")) {
      return `📝 **Here's the approach in pseudocode:**

\`\`\`
FUNCTION solveProblem(input):
    // Step 1: Validate input
    IF input is empty THEN
        RETURN default value
    
    // Step 2: Initialize result
    result = empty collection
    
    // Step 3: Process each item
    FOR each item in input:
        processed = transform(item)
        ADD processed TO result
    
    // Step 4: Return result
    RETURN result
END FUNCTION
\`\`\`

Now, try to translate this into actual code. What specific operations do you need in steps 1 and 3?`;
    }

    if (lowerMsg.includes("debug")) {
      return `🔍 **Debugging approach:**

Here's a systematic way to debug:

1. **Read the error message carefully** - It usually tells you exactly what's wrong
2. **Check line by line** - Use console.log() to see values at each step
3. **Test with simple inputs** - Try the smallest possible example
4. **Compare expected vs actual** - What did you expect vs what happened?

**Try this:** Add console.log() statements to see what your variables contain at each step. What do you see?`;
    }

    return `🤔 **Let's think through this together:**

I understand you're working on a coding problem. To help you best, could you tell me:

1. What is the problem asking you to do?
2. What have you tried so far?
3. Where specifically are you stuck?

Remember, the best way to learn is to work through the problem yourself with guidance. I'm here to help you think, not to think for you! 💪`;
  };

  const detectMessageType = (message: string): "hint" | "explanation" | "guidance" | "general" => {
    const lower = message.toLowerCase();
    if (lower.includes("hint")) return "hint";
    if (lower.includes("explain")) return "explanation";
    if (lower.includes("pseudocode") || lower.includes("debug")) return "guidance";
    return "general";
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "hint":
        return <Badge className="bg-yellow-500">Hint</Badge>;
      case "explanation":
        return <Badge className="bg-blue-500">Explanation</Badge>;
      case "guidance":
        return <Badge className="bg-purple-500">Guidance</Badge>;
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          AI Programming Assistant
        </h1>
        <p className="text-muted-foreground text-sm">
          Get hints, explanations, and guidance. I won't write code for you, but I'll help you learn!
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {QUICK_PROMPTS.map((prompt) => (
          <Button
            key={prompt.label}
            variant="outline"
            size="sm"
            onClick={() => handleSend(prompt.prompt)}
            disabled={isLoading}
            className="justify-start"
          >
            <prompt.icon className="w-4 h-4 mr-2" />
            {prompt.label}
          </Button>
        ))}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Chat</span>
            <Badge variant="outline" className="text-xs">
              {messages.length - 1} messages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" && message.type && (
                  <div className="mb-2">{getTypeBadge(message.type)}</div>
                )}
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask for a hint, explanation, or guidance... (I won't write code for you!)"
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: I provide hints and guidance, not complete solutions. This helps you learn better!
          </p>
        </div>
      </Card>
    </div>
  );
}
