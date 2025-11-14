export type PitchType = "startup" | "product" | "elevator";

export interface PitchPreferences {
  tone?: string;
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
  actualDurationSeconds?: number;
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

export interface ProcessPitchResponse {
  sessionId: string;
  transcript: string;
  analysis: PitchAnalysisResult;
  regeneratedPitch?: string;
}
