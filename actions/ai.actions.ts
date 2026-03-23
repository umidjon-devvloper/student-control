"use server";

import Anthropic from "@anthropic-ai/sdk";
import { ActionResult } from "./auth.actions";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CodeReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  codeQuality: "excellent" | "good" | "needs_work";
  encouragement: string;
}

export async function reviewCode(
  code: string,
  language: string,
  taskDescription: string
): Promise<ActionResult<CodeReviewResult>> {
  try {
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
      return { success: false, error: "Unexpected response type from AI" };
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse AI response" };
    }

    const review = JSON.parse(jsonMatch[0]) as CodeReviewResult;

    return { success: true, data: review };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to review code",
    };
  }
}

export async function generateChallenge(
  language: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<ActionResult<{ title: string; description: string; starterCode: string }>> {
  try {
    const prompt = `Generate a ${difficulty} programming challenge for ${language}. 

Provide the response in this JSON format:
{
  "title": "<challenge title>",
  "description": "<detailed description of what to implement>",
  "starterCode": "<starter code template>"
}

Make it educational and appropriate for students learning ${language}.`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return { success: false, error: "Unexpected response type from AI" };
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse AI response" };
    }

    const challenge = JSON.parse(jsonMatch[0]);

    return { success: true, data: challenge };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate challenge",
    };
  }
}

export async function motivateStudent(
  studentName: string,
  context: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const prompt = `Generate a short, encouraging motivational message for a student named ${studentName}.

Context: ${context}

The message should be:
- Warm and supportive
- Specific to the context
- Encouraging them to keep learning
- No longer than 2-3 sentences

Respond with just the message, no JSON formatting.`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return { success: false, error: "Unexpected response type from AI" };
    }

    return { success: true, data: { message: content.text.trim() } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate motivation",
    };
  }
}
