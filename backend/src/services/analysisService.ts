import { config } from "../config.js";
import { logger } from "../logger.js";
import type { PitchAnalysisResult, PitchMetadata } from "../types/pitch.js";
import {
  analyzeTextMetrics,
  computeOverallScore,
  estimateSentiment,
  estimateSpeakingRate,
  scoreClarity,
  scorePersuasiveness,
  scorePacing,
  scoreStructure,
  scoreTone,
} from "../utils/scoring.js";
import { getOpenAIClient } from "../utils/openaiClient.js";

interface AnalyzePitchParams {
  transcript: string;
  metadata: PitchMetadata;
  durationSeconds?: number;
}

const buildHeuristicSuggestions = (transcript: string, metadata: PitchMetadata, result: PitchAnalysisResult) => {
  const suggestions = { ...result.suggestions };
  const improvements = new Set(result.improvementAreas);
  const strengths = new Set(result.strengths);

  if (result.scores.clarity < 70) {
    suggestions.clarity = suggestions.clarity || "Trim filler words and tighten sentences to highlight your main message.";
    improvements.add("Reduce filler words and aim for concise sentences that land clearly.");
  } else {
    strengths.add("Message comes through clearly with minimal filler language.");
  }

  if (result.scores.structure < 70) {
    suggestions.structure =
      suggestions.structure ||
      "Outline the problem, who experiences it, and how your solution uniquely solves it before stating traction and ask.";
    improvements.add("Try a simple flow: hook → problem → solution → proof → ask.");
  } else {
    strengths.add("Structure flows logically and highlights key story beats.");
  }

  if (result.scores.pacing < 70) {
    suggestions.pacing =
      suggestions.pacing ||
      "Align the pace with your target length. Add breathing room or tighten sections to stay within the time limit.";
    improvements.add("Rehearse with a timer to stay close to the requested duration.");
  } else {
    strengths.add("Pacing feels comfortable for the chosen pitch length.");
  }

  if (result.scores.tone < 70) {
    suggestions.tone =
      suggestions.tone ||
      "Infuse more energy and confidence. Emphasize what excites you about the solution and audience impact.";
    improvements.add("Add confident language that signals momentum and credibility.");
  } else {
    strengths.add("Tone connects well and feels aligned with the audience.");
  }

  if (result.scores.persuasiveness < 70) {
    suggestions.persuasiveness =
      suggestions.persuasiveness ||
      "Highlight traction, credibility, or a clear ask so listeners know why this matters and what to do next.";
    improvements.add("Close with a single, direct call-to-action linked to your goal.");
  } else {
    strengths.add("You present compelling reasons for your audience to lean in.");
  }

  return {
    ...result,
    suggestions,
    improvementAreas: Array.from(improvements),
    strengths: Array.from(strengths),
  };
};

const buildPromptMetadata = (metadata: PitchMetadata) => {
  const metaLines = [
    `Pitch type: ${metadata.pitchType}`,
    `Target audience: ${metadata.targetAudience}`,
    metadata.pitchLengthSeconds ? `Target length (seconds): ${metadata.pitchLengthSeconds}` : null,
    metadata.preferences?.tone ? `Preferred tone: ${metadata.preferences?.tone}` : null,
    metadata.preferences?.focusAreas?.length
      ? `Focus areas: ${metadata.preferences?.focusAreas?.join(", ")}`
      : null,
    metadata.preferences?.callToAction ? `Desired call-to-action: ${metadata.preferences?.callToAction}` : null,
    metadata.preferences?.additionalContext ? `Additional context: ${metadata.preferences?.additionalContext}` : null,
    metadata.companyName ? `Company name: ${metadata.companyName}` : null,
    metadata.productName ? `Product name: ${metadata.productName}` : null,
    metadata.goal ? `Pitch goal: ${metadata.goal}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return metaLines;
};

const buildHeuristicSummary = (metadata: PitchMetadata, result: PitchAnalysisResult) => {
  const segments = [
    `This ${metadata.pitchType} pitch for ${metadata.targetAudience} runs ${result.wordCount} words.`,
    result.speakingRateWpm
      ? `Your estimated speaking rate is ${result.speakingRateWpm} words per minute, which is ${
          result.scores.pacing >= 70 ? "on track" : "outside the ideal range"
        } for the target duration.`
      : null,
    `Clarity and structure score ${result.scores.clarity} and ${result.scores.structure}, indicating ${
      result.scores.clarity > 75 ? "strong messaging" : "room for tightening the story arc"
    }.`,
    `Tone presents as ${result.sentiment}, and persuasiveness is rated ${result.scores.persuasiveness}.`,
  ].filter(Boolean);

  return segments.join(" ");
};

const requestLLMAnalysis = async (
  transcript: string,
  metadata: PitchMetadata,
  heuristics: PitchAnalysisResult,
): Promise<Partial<PitchAnalysisResult> | null> => {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.responses.create({
      model: config.models.gpt,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pitch_analysis",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              improvementAreas: { type: "array", items: { type: "string" } },
              suggestions: {
                type: "object",
                properties: {
                  clarity: { type: "string" },
                  structure: { type: "string" },
                  pacing: { type: "string" },
                  tone: { type: "string" },
                  persuasiveness: { type: "string" },
                },
                required: ["clarity", "structure", "pacing", "tone", "persuasiveness"],
              },
            },
            required: ["summary", "strengths", "improvementAreas", "suggestions"],
            additionalProperties: false,
          },
        },
      },
      input: [
        {
          role: "system",
          content:
            "You are an expert pitch coach. Analyze the transcript and provide tactical, kind feedback. Respect the provided JSON schema. Keep items concise (<= 180 characters).",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Transcript:",
                transcript,
                "\n---\nHeuristic analysis:",
                JSON.stringify(heuristics, null, 2),
                "\n---\nMetadata:\n",
                buildPromptMetadata(metadata),
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const jsonText = (response as any)?.output_text ?? response?.output?.[0]?.content?.[0]?.text ?? "";

    if (!jsonText) {
      logger.warn("OpenAI response missing text content");
      return null;
    }

    return JSON.parse(jsonText);
  } catch (error) {
    logger.error({ err: error }, "Failed to get analysis from OpenAI");
    return null;
  }
};

export const analyzePitch = async ({
  transcript,
  metadata,
  durationSeconds,
}: AnalyzePitchParams): Promise<PitchAnalysisResult> => {
  const metrics = analyzeTextMetrics(transcript);
  const speakingRateWpm = estimateSpeakingRate(metrics.wordCount, durationSeconds ?? metadata.pitchLengthSeconds);

  const clarity = scoreClarity(metrics);
  const structure = scoreStructure(transcript, metrics);
  const pacing = scorePacing(speakingRateWpm, metadata.pitchLengthSeconds, durationSeconds);
  const tone = scoreTone(metrics);
  const persuasiveness = scorePersuasiveness(transcript, metrics);

    const heuristics: PitchAnalysisResult = {
      summary: "",
      transcript,
      wordCount: metrics.wordCount,
      speakingRateWpm,
      sentiment: estimateSentiment(metrics),
      readingTimeSeconds: Math.round((metrics.wordCount / 130) * 60),
      scores: {
        clarity,
        structure,
        pacing,
        tone,
        persuasiveness,
        overall: computeOverallScore({
          clarity,
          structure,
          pacing,
          tone,
          persuasiveness,
        }),
      },
      suggestions: {
        clarity: "",
        structure: "",
        pacing: "",
        tone: "",
        persuasiveness: "",
      },
      strengths: [],
      improvementAreas: [],
    };

    const llmAnalysis = await requestLLMAnalysis(transcript, metadata, heuristics);

    const summaryText = llmAnalysis?.summary ?? buildHeuristicSummary(metadata, heuristics);

    const merged: PitchAnalysisResult = llmAnalysis
      ? {
          ...heuristics,
          ...llmAnalysis,
          summary: summaryText,
          suggestions: {
            ...heuristics.suggestions,
            ...llmAnalysis.suggestions,
          },
          strengths: llmAnalysis.strengths ?? [],
          improvementAreas: llmAnalysis.improvementAreas ?? [],
        }
      : buildHeuristicSuggestions(transcript, metadata, {
          ...heuristics,
          summary: summaryText,
        });

  if (!llmAnalysis) {
    logger.warn("Returning heuristic analysis (OpenAI disabled or failed).");
  }

  return merged;
};
