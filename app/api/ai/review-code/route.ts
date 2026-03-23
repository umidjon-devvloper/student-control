import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { code, language, taskDescription } = await request.json();

    if (!code || !language || !taskDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `You are a programming teacher reviewing student code. Please review the following ${language} code submission.

Task Description: ${taskDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide a detailed review in the following JSON format:
{
  "score": <number between 0-100>,
  "summary": "<brief summary of the code>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "codeQuality": "<excellent|good|needs_work>",
  "encouragement": "<encouraging message for the student>"
}

Be encouraging but honest. Focus on both what was done well and what can be improved.`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response type from AI" },
        { status: 500 }
      );
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const review = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ review });
  } catch (error) {
    console.error("AI review error:", error);
    return NextResponse.json(
      { error: "Failed to review code" },
      { status: 500 }
    );
  }
}
