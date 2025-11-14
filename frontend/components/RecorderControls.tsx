"use client";

import clsx from "clsx";
import type { UseRecorderReturn } from "../hooks/useRecorder";

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

interface RecorderControlsProps {
  recorder: UseRecorderReturn;
}

export const RecorderControls = ({ recorder }: RecorderControlsProps) => {
  const { status, duration, startRecording, stopRecording, reset, error, audioUrl } = recorder;

  const isRecording = status === "recording";
  const hasRecording = !!audioUrl;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-light">Recorder</p>
          <h2 className="mt-1 text-2xl font-semibold">Capture your pitch</h2>
          <p className="mt-2 text-sm text-slate-300">
            Start recording and pitch as if you&apos;re in front of your ideal audience. Stop when you&apos;re done—we&apos;ll
            handle the rest.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-slate-900/80 px-4 py-3">
          <span
            className={clsx(
              "inline-flex h-2.5 w-2.5 rounded-full transition-colors",
              isRecording ? "bg-danger animate-pulse" : "bg-slate-500",
            )}
          />
          <span className="font-mono text-lg tabular-nums">{formatDuration(duration)}</span>
          <span className="text-xs uppercase tracking-wider text-slate-400">{status}</span>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={clsx(
            "rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            isRecording ? "bg-danger hover:bg-danger/90" : "bg-primary hover:bg-primary-dark",
          )}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={status === "idle" && !hasRecording}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
        >
          Reset
        </button>

        {hasRecording && (
          <audio className="ml-auto w-full sm:w-64" controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
};
