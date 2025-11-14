import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { getOpenAIClient } from "../utils/openaiClient.js";
import type { TranscriptionResult } from "../types/pitch.js";

const DEFAULT_TRANSCRIPTION = "Transcription is unavailable in offline mode. Please provide text manually.";

const writeTempFile = async (buffer: Buffer, originalName?: string) => {
  const safeName = originalName?.replace(/\s+/g, "-").toLowerCase() ?? "audio.webm";
  const tmpPath = path.join(tmpdir(), `${uuid()}-${safeName}`);
  await fs.promises.writeFile(tmpPath, buffer);
  return tmpPath;
};

export const transcribeAudio = async (
  fileBuffer: Buffer,
  filename: string | undefined,
  mimeType: string | undefined,
): Promise<TranscriptionResult> => {
  const client = getOpenAIClient();

  if (!client) {
    logger.warn("OpenAI API key not provided. Returning placeholder transcription.");
    return {
      text: DEFAULT_TRANSCRIPTION,
    };
  }

  const tempFilePath = await writeTempFile(fileBuffer, filename);

  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: config.models.transcription,
      response_format: "verbose_json",
      temperature: 0,
    });

    const text = typeof transcription.text === "string" ? transcription.text.trim() : "";

    return {
      text: text.length > 0 ? text : DEFAULT_TRANSCRIPTION,
      raw: transcription,
      durationSeconds: typeof (transcription as any)?.duration === "number" ? (transcription as any).duration : undefined,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to transcribe audio");
    return {
      text: DEFAULT_TRANSCRIPTION,
      raw: { error: String(error) },
    };
  } finally {
    await fs.promises.unlink(tempFilePath).catch((error) => {
      logger.warn({ err: error }, "Failed to delete temporary transcription file");
    });
  }
};
