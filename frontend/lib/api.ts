import axios from "axios";
import type { PitchMetadata, PitchAnalysisResult, ProcessPitchResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface ProcessPitchParams {
  metadata: PitchMetadata;
  audioBlob?: Blob | null;
  transcript?: string | null;
  shouldRegenerate?: boolean;
}

export const processPitch = async ({
  metadata,
  audioBlob,
  transcript,
  shouldRegenerate = true,
}: ProcessPitchParams): Promise<ProcessPitchResponse> => {
  const formData = new FormData();
  formData.append("metadata", JSON.stringify(metadata));
  formData.append("shouldRegenerate", String(shouldRegenerate));

  if (audioBlob) {
    const file = new File([audioBlob], "pitch-recording.webm", { type: audioBlob.type || "audio/webm" });
    formData.append("audio", file);
  }

  if (transcript?.trim()) {
    formData.append("transcript", transcript.trim());
  }

  const { data } = await axios.post<ProcessPitchResponse>(`${API_BASE_URL}/api/pitch/process`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

interface RegeneratePitchParams {
  transcript: string;
  metadata: PitchMetadata;
  focusPoints?: string[];
  feedbackSummary?: string;
}

export const regeneratePitch = async ({
  transcript,
  metadata,
  focusPoints,
  feedbackSummary,
}: RegeneratePitchParams): Promise<string> => {
  const { data } = await axios.post<{ regeneratedPitch: string }>(`${API_BASE_URL}/api/pitch/regenerate`, {
    transcript,
    metadata,
    focusPoints,
    feedbackSummary,
  });

  return data.regeneratedPitch;
};

export type { PitchAnalysisResult, ProcessPitchResponse };
