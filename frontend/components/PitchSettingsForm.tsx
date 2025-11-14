"use client";

import clsx from "clsx";
import type { FormEvent } from "react";
import type { PitchType } from "../lib/types";

export interface PitchSettingsState {
  pitchType: PitchType;
  pitchLengthSeconds: number;
  targetAudience: string;
  tone: string;
  focusAreas: string;
  callToAction: string;
  additionalContext: string;
  shouldRegenerate: boolean;
  manualTranscript: string;
}

interface PitchSettingsFormProps {
  values: PitchSettingsState;
  onChange: (update: Partial<PitchSettingsState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isProcessing: boolean;
}

const pitchLengthOptions = [
  { label: "30 seconds", value: 30 },
  { label: "45 seconds", value: 45 },
  { label: "60 seconds", value: 60 },
  { label: "90 seconds", value: 90 },
  { label: "2 minutes", value: 120 },
];

export const PitchSettingsForm = ({ values, onChange, onSubmit, isProcessing }: PitchSettingsFormProps) => {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-primary-light">Setup</p>
        <h2 className="text-2xl font-semibold">Tailor your pitch session</h2>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">Pitch type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["startup", "product", "elevator"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ pitchType: type })}
                className={clsx(
                  "rounded-2xl border px-3 py-2 text-sm font-semibold capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light",
                  values.pitchType === type
                    ? "border-primary bg-primary/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">Target audience</label>
          <input
            type="text"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Investors, hackathon judges, customers, recruiters..."
            value={values.targetAudience}
            onChange={(event) => onChange({ targetAudience: event.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">Pitch length</label>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={values.pitchLengthSeconds}
            onChange={(event) => onChange({ pitchLengthSeconds: Number(event.target.value) })}
          >
            {pitchLengthOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900 text-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">Preferred tone</label>
          <input
            type="text"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Confident, conversational, visionary..."
            value={values.tone}
            onChange={(event) => onChange({ tone: event.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-200">Focus areas (comma separated)</label>
          <input
            type="text"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Problem-solution fit, traction, go-to-market..."
            value={values.focusAreas}
            onChange={(event) => onChange({ focusAreas: event.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-200">Call to action</label>
          <input
            type="text"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Request a meeting, ask for investment, invite beta sign-ups..."
            value={values.callToAction}
            onChange={(event) => onChange({ callToAction: event.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-200">Additional context</label>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Mention product status, upcoming demo day, pitch goal..."
            value={values.additionalContext}
            onChange={(event) => onChange({ additionalContext: event.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-200">Manual transcript (optional)</label>
          <textarea
            rows={5}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Paste your pitch text if you prefer skipping the recorder."
            value={values.manualTranscript}
            onChange={(event) => onChange({ manualTranscript: event.target.value })}
          />
        </div>

        <label className="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={values.shouldRegenerate}
            onChange={(event) => onChange({ shouldRegenerate: event.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-primary"
          />
          Auto-generate an improved pitch after analysis
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isProcessing}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/40"
        >
          {isProcessing ? "Analyzing..." : "Analyze my pitch"}
        </button>
      </div>
    </form>
  );
};
