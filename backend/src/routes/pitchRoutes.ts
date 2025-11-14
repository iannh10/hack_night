import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { analyzePitch } from "../services/analysisService.js";
import { transcribeAudio } from "../services/transcriptionService.js";
import { regeneratePitch } from "../services/regenerationService.js";
import type { PitchMetadata, PitchRegeneratePayload } from "../types/pitch.js";
import { logger } from "../logger.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});

const preferencesSchema = z
  .object({
    tone: z.string().min(2).max(40).optional(),
    focusAreas: z.array(z.string()).optional(),
    callToAction: z.string().min(2).max(120).optional(),
    additionalContext: z.string().max(500).optional(),
  })
  .optional();

const metadataSchema = z.object({
  pitchType: z.enum(["startup", "product", "elevator"]),
  pitchLengthSeconds: z.coerce.number().min(15).max(300).optional(),
  targetAudience: z.string().min(2).max(120),
  preferences: preferencesSchema,
  userName: z.string().max(120).optional(),
  companyName: z.string().max(160).optional(),
  productName: z.string().max(160).optional(),
  goal: z.string().max(160).optional(),
  actualDurationSeconds: z.coerce.number().min(5).max(600).optional(),
});

const baseRouter = Router();

baseRouter.post("/pitch/process", upload.single("audio"), async (request, response) => {
  try {
    const metadataRaw =
      request.body.metadata ?? request.body.payload ?? request.body.meta ?? request.body.settings ?? "{}";

    const parsedMetadata: PitchMetadata = metadataSchema.parse(
      typeof metadataRaw === "string" ? JSON.parse(metadataRaw) : metadataRaw,
    );

    const shouldRegenerate =
      typeof request.body.shouldRegenerate === "string"
        ? ["true", "1", "yes"].includes(request.body.shouldRegenerate.toLowerCase())
        : request.body.shouldRegenerate !== undefined
        ? Boolean(request.body.shouldRegenerate)
        : true;

    const manualTranscript =
      typeof request.body.transcript === "string" && request.body.transcript.trim().length > 0
        ? request.body.transcript.trim()
        : null;

    if (!request.file && !manualTranscript) {
      return response.status(400).json({
        message: "An audio file or manual transcript is required.",
      });
    }

    const transcriptionResult = request.file
      ? await transcribeAudio(request.file.buffer, request.file.originalname, request.file.mimetype)
      : { text: manualTranscript ?? "", raw: null, durationSeconds: parsedMetadata.actualDurationSeconds };

    const transcript = transcriptionResult.text;

    if (!transcript || transcript.trim().length === 0) {
      return response.status(422).json({
        message: "Unable to derive transcript from the provided input.",
        transcript,
      });
    }

    const analysis = await analyzePitch({
      transcript,
      metadata: parsedMetadata,
      durationSeconds: transcriptionResult.durationSeconds ?? parsedMetadata.actualDurationSeconds,
    });

    let regeneratedPitch: string | undefined;
    if (shouldRegenerate) {
      regeneratedPitch = await regeneratePitch({
        transcript,
        metadata: parsedMetadata,
        feedbackSummary: analysis.improvementAreas.slice(0, 3).join("; "),
      });
    }

    const sessionId = uuid();

    return response.json({
      sessionId,
      transcript,
      analysis,
      regeneratedPitch,
      raw: {
        transcription: transcriptionResult.raw,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to process pitch");
    return response.status(500).json({
      message: "Unable to process pitch at this time.",
    });
  }
});

baseRouter.post("/pitch/regenerate", async (request, response) => {
  try {
    const regenerateSchema = z.object({
      transcript: z.string().min(20, "Transcript must be at least 20 characters."),
      metadata: metadataSchema,
      focusPoints: z.array(z.string()).optional(),
      feedbackSummary: z.string().optional(),
    });

    const payload: PitchRegeneratePayload = regenerateSchema.parse(request.body);

    const regeneratedPitch = await regeneratePitch(payload);

    return response.json({
      regeneratedPitch,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to regenerate pitch");
    return response.status(400).json({
      message: "Invalid regenerate payload.",
    });
  }
});

export const pitchRouter = baseRouter;
