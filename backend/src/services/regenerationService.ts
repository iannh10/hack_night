import { config } from "../config.js";
import { logger } from "../logger.js";
import type { PitchMetadata, PitchRegeneratePayload } from "../types/pitch.js";
import { getOpenAIClient } from "../utils/openaiClient.js";

const MAX_WORD_COUNT_BY_LENGTH: Record<number, number> = {
  30: 75,
  45: 105,
  60: 135,
  90: 200,
  120: 260,
};

const buildPromptMetadata = (metadata: PitchMetadata) => {
  const lines = [
    `Pitch type: ${metadata.pitchType}`,
    `Target audience: ${metadata.targetAudience}`,
    metadata.pitchLengthSeconds ? `Target length: ${metadata.pitchLengthSeconds} seconds` : null,
    metadata.preferences?.tone ? `Preferred tone: ${metadata.preferences.tone}` : null,
    metadata.preferences?.focusAreas?.length
      ? `Focus areas: ${metadata.preferences.focusAreas.join(", ")}`
      : null,
    metadata.preferences?.callToAction ? `Desired call-to-action: ${metadata.preferences.callToAction}` : null,
    metadata.preferences?.additionalContext ? `Extra context: ${metadata.preferences.additionalContext}` : null,
    metadata.companyName ? `Company name: ${metadata.companyName}` : null,
    metadata.productName ? `Product name: ${metadata.productName}` : null,
    metadata.goal ? `Pitch goal: ${metadata.goal}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
};

const fallbackTemplates: Record<PitchMetadata["pitchType"], string[]> = {
  startup: [
    "Hook your listener with the problem your target audience faces and why the status quo cannot keep up.",
    "Introduce your startup with a crisp one-liner: who you help, what you deliver, and the breakthrough advantage.",
    "Share traction points or proof like users, revenue, pilots, or partnerships that validate the model.",
    "Close with a bold ask that matches the audience—investment amount, intros, pilots, or mentoring.",
  ],
  product: [
    "Open with the core pain your customer feels today and the cost of ignoring it.",
    "Demonstrate how your product solves the pain in a single sentence and spotlight the wow moment.",
    "Highlight differentiators such as unique technology, workflow fit, or results.",
    "Share a customer win or testimonial to build trust, then invite the audience to try or learn more.",
  ],
  elevator: [
    "Lead with a one-sentence hook that states what you do and for whom.",
    "Outline the key benefit or outcome your audience cares about.",
    "Add a memorable proof point or differentiator to raise credibility.",
    "Finish with a clear next step—schedule a call, request a deck, or visit a link.",
  ],
};

const estimateMaxWords = (metadata: PitchMetadata) => {
  if (!metadata.pitchLengthSeconds) {
    return 180;
  }
  const keys = Object.keys(MAX_WORD_COUNT_BY_LENGTH)
    .map((key) => Number.parseInt(key, 10))
    .sort((a, b) => a - b);
  for (const key of keys) {
    if (metadata.pitchLengthSeconds <= key) {
      return MAX_WORD_COUNT_BY_LENGTH[key];
    }
  }
  return Math.round(metadata.pitchLengthSeconds * 2.2);
};

const buildFallbackPitch = ({ transcript, metadata, focusPoints, feedbackSummary }: PitchRegeneratePayload): string => {
  const bulletPoints = fallbackTemplates[metadata.pitchType];
  const maxWords = estimateMaxWords(metadata);

  const intro = `Let's refine your ${metadata.pitchType} pitch for ${metadata.targetAudience}.`;
  const focusLine = focusPoints?.length
    ? `Key focus points: ${focusPoints.join(", ")}.`
    : "We'll maintain the core message while tightening the flow.";

  const synthesized = [
    intro,
    focusLine,
    feedbackSummary ? `Coach notes: ${feedbackSummary}.` : null,
    "",
    "Suggested structure:",
    ...bulletPoints.map((point, index) => `${index + 1}. ${point}`),
    "",
    "Original key ideas to keep:",
    transcript
      .split(/\.\s+/)
      .slice(0, 3)
      .map((sentence) => `- ${sentence.trim()}.`),
    "",
    `Aim for ~${maxWords} words (${metadata.pitchLengthSeconds ?? 60} seconds).`,
  ]
    .flat()
    .filter(Boolean)
    .join("\n");

  return synthesized;
};

export const regeneratePitch = async (payload: PitchRegeneratePayload): Promise<string> => {
  const client = getOpenAIClient();

  if (!client) {
    logger.warn("OpenAI API key not configured. Returning structured fallback pitch guidance.");
    return buildFallbackPitch(payload);
  }

  try {
    const maxWords = estimateMaxWords(payload.metadata);

    const response = await client.responses.create({
      model: config.models.gpt,
      temperature: 0.65,
      max_output_tokens: Math.min(maxWords * 2, 1200),
      input: [
        {
          role: "system",
          content:
            "You are an elite pitch coach and speechwriter. Rewrite the pitch to sound confident, concise, and persuasive. Keep it under the requested length.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Current transcript:",
                payload.transcript,
                "\n---\nMetadata:\n",
                buildPromptMetadata(payload.metadata),
                payload.focusPoints?.length ? `\nFocus points: ${payload.focusPoints.join(", ")}` : "",
                payload.feedbackSummary ? `\nCoach feedback: ${payload.feedbackSummary}` : "",
                `\nOutput instructions: Provide a single refined pitch under ${maxWords} words. Use paragraph form with line breaks between sections.`,
              ].join(""),
            },
          ],
        },
      ],
    });

    const text = response?.output?.[0]?.content?.[0]?.text ?? "";
    if (!text) {
      throw new Error("OpenAI response did not include text output.");
    }

    return text.trim();
  } catch (error) {
    logger.error({ err: error }, "Failed to regenerate pitch with OpenAI. Falling back to template output.");
    return buildFallbackPitch(payload);
  }
};
