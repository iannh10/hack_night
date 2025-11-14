import OpenAI from "openai";
import { config, isOpenAIEnabled } from "../config.js";
import { logger } from "../logger.js";

let client: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI | null => {
  if (!isOpenAIEnabled()) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    logger.info("OpenAI client initialized");
  }

  return client;
};
