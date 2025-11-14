"use client";

import { useState } from "react";
import { RecorderControls } from "../components/RecorderControls";
import { PitchSettingsForm, type PitchSettingsState } from "../components/PitchSettingsForm";
import { AnalysisResults } from "../components/AnalysisResults";
import { useRecorder } from "../hooks/useRecorder";
import { processPitch } from "../lib/api";
import type { PitchMetadata, ProcessPitchResponse } from "../lib/types";

interface SessionState extends ProcessPitchResponse {
  metadata: PitchMetadata;
}

const initialSettings: PitchSettingsState = {
  pitchType: "startup",
  pitchLengthSeconds: 60,
  targetAudience: "investors",
  tone: "confident",
  focusAreas: "problem-solution fit, traction, call-to-action",
  callToAction: "Request a follow-up meeting",
  additionalContext: "",
  shouldRegenerate: true,
  manualTranscript: "",
};

export default function HomePage() {
  const recorder = useRecorder();
  const [settings, setSettings] = useState<PitchSettingsState>(initialSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);

  const handleSettingsChange = (update: Partial<PitchSettingsState>) =>
    setSettings((previous) => ({ ...previous, ...update }));

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError(null);

    if (!recorder.audioBlob && !settings.manualTranscript.trim()) {
      setError("Please record your pitch or paste a manual transcript before analyzing.");
      return;
    }

    setIsProcessing(true);

    const focusAreas = settings.focusAreas
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const metadata: PitchMetadata = {
      pitchType: settings.pitchType,
      pitchLengthSeconds: settings.pitchLengthSeconds,
      targetAudience: settings.targetAudience,
      preferences: {
        tone: settings.tone || undefined,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        callToAction: settings.callToAction || undefined,
        additionalContext: settings.additionalContext || undefined,
      },
      actualDurationSeconds: recorder.audioBlob ? recorder.duration : undefined,
    };

    try {
      const response = await processPitch({
        metadata,
        audioBlob: recorder.audioBlob ?? undefined,
        transcript: settings.manualTranscript || null,
        shouldRegenerate: settings.shouldRegenerate,
      });

      setSession({
        ...response,
        metadata,
      });
    } catch (requestError) {
      console.error(requestError);
      setError("We couldn’t analyze this pitch. Please try again or verify your backend connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4 text-center sm:text-left">
        <span className="inline-flex items-center rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-light">
          AI Pitch Coach
        </span>
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          Sharpen your pitch. <span className="text-primary-light">In real time.</span>
        </h1>
        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
          Record your pitch, get transcript-backed analysis, and receive targeted coaching powered by AI. Score clarity,
          structure, pacing, tone, and persuasiveness—then generate a polished iteration instantly.
        </p>
      </header>

      <RecorderControls recorder={recorder} />

      <PitchSettingsForm values={settings} onChange={handleSettingsChange} onSubmit={handleSubmit} isProcessing={isProcessing} />

      {error && <p className="rounded-3xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {session && (
        <AnalysisResults
          sessionId={session.sessionId}
          analysis={session.analysis}
          regeneratedPitch={session.regeneratedPitch}
          metadata={session.metadata}
          onRegenerate={(pitch) => setSession((prev) => (prev ? { ...prev, regeneratedPitch: pitch } : prev))}
        />
      )}
    </main>
  );
}
