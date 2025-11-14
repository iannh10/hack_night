"use client";

import { useEffect, useState } from "react";
import { regeneratePitch as regeneratePitchApi } from "../lib/api";
import type { PitchAnalysisResult, PitchMetadata } from "../lib/types";

interface AnalysisResultsProps {
  sessionId: string;
  analysis: PitchAnalysisResult;
  regeneratedPitch?: string;
  metadata: PitchMetadata;
  onRegenerate?: (pitch: string) => void;
}

const sentimentCopy: Record<PitchAnalysisResult["sentiment"], string> = {
  positive: "positive, energetic delivery",
  neutral: "balanced delivery",
  negative: "cautious or risk-focused tone",
};

const sentimentColor: Record<PitchAnalysisResult["sentiment"], string> = {
  positive: "text-success",
  neutral: "text-warning",
  negative: "text-danger",
};

const ScorePill = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
  </div>
);

export const AnalysisResults = ({ sessionId, analysis, regeneratedPitch, metadata, onRegenerate }: AnalysisResultsProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [pitchText, setPitchText] = useState(regeneratedPitch);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    setPitchText(regeneratedPitch);
  }, [regeneratedPitch]);

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const pitch = await regeneratePitchApi({
        transcript: analysis.transcript,
        metadata,
        feedbackSummary: analysis.improvementAreas.slice(0, 3).join("; "),
      });
      setPitchText(pitch);
      onRegenerate?.(pitch);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!pitchText) return;
    try {
      await navigator.clipboard.writeText(pitchText);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch (error) {
      console.error(error);
      setCopyStatus("error");
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-light">Session {sessionId.slice(0, 8)}</p>
          <h2 className="text-2xl font-semibold">Pitch Analysis</h2>
        </div>
        <p className="text-sm text-slate-300">
          {analysis.wordCount} words • Speaking rate {analysis.speakingRateWpm} wpm •{" "}
          <span className={sentimentColor[analysis.sentiment]}>{sentimentCopy[analysis.sentiment]}</span>
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ScorePill label="Clarity" value={analysis.scores.clarity} />
        <ScorePill label="Structure" value={analysis.scores.structure} />
        <ScorePill label="Pacing" value={analysis.scores.pacing} />
        <ScorePill label="Tone" value={analysis.scores.tone} />
        <ScorePill label="Persuasiveness" value={analysis.scores.persuasiveness} />
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-wide text-primary-light">Overall</p>
          <p className="mt-2 text-3xl font-semibold text-white">{analysis.scores.overall}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Summary</h3>
          <p className="text-sm text-slate-200">{analysis.summary}</p>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-light">Strengths</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {analysis.strengths.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-success" />
                  <span>{item}</span>
                </li>
              ))}
              {analysis.strengths.length === 0 && <li className="text-slate-400">No strengths captured.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Action plan</h3>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-light">Improvements</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {analysis.improvementAreas.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning" />
                  <span>{item}</span>
                </li>
              ))}
              {analysis.improvementAreas.length === 0 && <li className="text-slate-400">No issues flagged.</li>}
            </ul>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-light">Targeted coaching</h4>
            <dl className="grid grid-cols-1 gap-2 text-sm text-slate-200">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Clarity</dt>
                <dd>{analysis.suggestions.clarity}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Structure</dt>
                <dd>{analysis.suggestions.structure}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Pacing</dt>
                <dd>{analysis.suggestions.pacing}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Tone</dt>
                <dd>{analysis.suggestions.tone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Persuasiveness</dt>
                <dd>{analysis.suggestions.persuasiveness}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4 rounded-3xl border border-primary/40 bg-primary/10 p-6">
        <header className="flex flex-wrap items-center gap-2 justify-between">
          <h3 className="text-lg font-semibold text-white">Improved pitch</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!pitchText}
              className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
            >
              {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Error" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/60"
            >
              {isRegenerating ? "Refreshing..." : "Regenerate"}
            </button>
          </div>
        </header>

        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-100">
          {pitchText ?? "Enable regeneration to get a polished draft of your pitch."}
        </p>
      </div>
    </section>
  );
};
