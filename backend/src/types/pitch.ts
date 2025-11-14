export type PitchType = "startup" | "product" | "elevator";

export interface PitchPreferences {
  tone?: "conversational" | "enthusiastic" | "confident" | "casual" | "formal" | string;
  focusAreas?: string[];
  callToAction?: string;
  additionalContext?: string;
}

export interface PitchMetadata {
  pitchType: PitchType;
  pitchLengthSeconds?: number;
  targetAudience: string;
  preferences?: PitchPreferences;
  userName?: string;
  companyName?: string;
  productName?: string;
  goal?: string;
}

export interface TranscriptionResult {
  text: string;
  raw?: unknown;
  durationSeconds?: number;
}

export interface PitchAnalysisScores {
  clarity: number;
  structure: number;
  pacing: number;
  tone: number;
  persuasiveness: number;
  overall: number;
}

export interface PitchAnalysisSuggestions {
  clarity: string;
  structure: string;
  pacing: string;
  tone: string;
  persuasiveness: string;
}

export interface PitchAnalysisResult {
  summary: string;
  transcript: string;
  wordCount: number;
  speakingRateWpm: number;
  sentiment: "positive" | "neutral" | "negative";
  readingTimeSeconds: number;
  scores: PitchAnalysisScores;
  suggestions: PitchAnalysisSuggestions;
  strengths: string[];
  improvementAreas: string[];
}

export interface PitchProcessResponse {
  sessionId: string;
  transcript: string;
  analysis: PitchAnalysisResult;
  regeneratedPitch?: string;
  raw?: Record<string, unknown>;
}

export interface PitchRegeneratePayload {
  transcript: string;
  metadata: PitchMetadata;
  focusPoints?: string[];
  feedbackSummary?: string;
}
