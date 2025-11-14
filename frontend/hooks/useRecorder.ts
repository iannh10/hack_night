import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "stopped";

export const useRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const isSupported = typeof window !== "undefined" && "MediaRecorder" in window;

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    startTimestampRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      setAudioBlob(null);
      setError(null);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearTimer();
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setStatus("stopped");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
      startTimestampRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        if (startTimestampRef.current) {
          setDuration(Math.round((Date.now() - startTimestampRef.current) / 1000));
        }
      }, 250);
    } catch (err) {
      console.error(err);
      setError("Unable to access microphone. Please check your browser permissions.");
    }
  }, [isSupported]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const audioUrl = useMemo(() => {
    if (!audioBlob) {
      return null;
    }
    return URL.createObjectURL(audioBlob);
  }, [audioBlob]);

  return {
    status,
    error,
    duration,
    audioBlob,
    audioUrl,
    isSupported,
    startRecording,
    stopRecording,
    reset,
  };
};

export type UseRecorderReturn = ReturnType<typeof useRecorder>;
