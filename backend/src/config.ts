import dotenv from "dotenv";

dotenv.config();

const DEFAULT_ORIGINS = ["http://localhost:3000"];

const normalizedOrigins = (process.env.ORIGIN_WHITELIST ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number.parseInt(process.env.PORT ?? "4000", 10),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  models: {
    gpt: process.env.OPENAI_MODEL_GPT ?? "gpt-4o-mini",
    transcription: process.env.OPENAI_MODEL_TRANSCRIPTION ?? "gpt-4o-mini-transcribe",
  },
  cors: {
    origins: normalizedOrigins.length > 0 ? normalizedOrigins : DEFAULT_ORIGINS,
  },
};

export const isOpenAIEnabled = () => Boolean(config.openaiApiKey);
