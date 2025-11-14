const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const fillerWords = [
  "um",
  "uh",
  "like",
  "you know",
  "so",
  "actually",
  "basically",
  "literally",
  "stuff",
];

const positiveWords = ["excited", "innovative", "growth", "opportunity", "success", "impact", "value"];
const negativeWords = ["problem", "challenge", "risk", "concern", "struggle", "issue", "difficult"];

export interface TextMetrics {
  wordCount: number;
  sentenceCount: number;
  fillerWordCount: number;
  averageSentenceLength: number;
  uniqueWordRatio: number;
  positiveSentimentCount: number;
  negativeSentimentCount: number;
}

export const analyzeTextMetrics = (transcript: string): TextMetrics => {
  const words = transcript
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9']/gi, ""))
    .filter(Boolean);

  const sentences = transcript
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const fillerWordCount = words.filter((word) => fillerWords.includes(word)).length;
  const uniqueWordCount = new Set(words).size;

  const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length;

  const lowerTranscript = transcript.toLowerCase();
  const positiveSentimentCount = positiveWords.reduce(
    (acc, word) => acc + (lowerTranscript.includes(word) ? 1 : 0),
    0,
  );
  const negativeSentimentCount = negativeWords.reduce(
    (acc, word) => acc + (lowerTranscript.includes(word) ? 1 : 0),
    0,
  );

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    fillerWordCount,
    averageSentenceLength,
    uniqueWordRatio: words.length > 0 ? uniqueWordCount / words.length : 0,
    positiveSentimentCount,
    negativeSentimentCount,
  };
};

export const estimateSpeakingRate = (wordCount: number, durationSeconds?: number): number => {
  if (!durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  return Math.round((wordCount / durationSeconds) * 60);
};

export const scoreClarity = (metrics: TextMetrics): number => {
  const fillerPenalty = metrics.wordCount > 0 ? (metrics.fillerWordCount / metrics.wordCount) * 100 : 0;
  const averageSentenceScore = 100 - Math.abs(metrics.averageSentenceLength - 18) * 2;
  const uniqueWordBonus = metrics.uniqueWordRatio * 50;

  const rawScore = 80 - fillerPenalty + averageSentenceScore * 0.1 + uniqueWordBonus;
  return clamp(rawScore);
};

export const scoreStructure = (transcript: string, metrics: TextMetrics): number => {
  const hasProblem = /problem|challenge|pain point|issue/i.test(transcript);
  const hasSolution = /solution|we built|we offer|our product/i.test(transcript);
  const hasMarket = /market|customers|users|audience|buyers/i.test(transcript);
  const hasTraction = /revenue|growth|traction|milestone|customers/i.test(transcript);

  const structureHits = [hasProblem, hasSolution, hasMarket, hasTraction].filter(Boolean).length;
  const sentenceScore = metrics.sentenceCount >= 3 ? 20 : metrics.sentenceCount * 5;

  return clamp(50 + structureHits * 12 + sentenceScore);
};

export const scorePacing = (speakingRate: number, targetLengthSeconds?: number, actualLengthSeconds?: number): number => {
  if (!speakingRate) {
    return clamp(65);
  }
  const idealSpeakingRate = 135;
  const speakingRateScore = 100 - Math.abs(speakingRate - idealSpeakingRate) * 0.6;

  if (!targetLengthSeconds || !actualLengthSeconds) {
    return clamp(speakingRateScore);
  }

  const lengthDelta = Math.abs(actualLengthSeconds - targetLengthSeconds);
  const lengthScore = 100 - lengthDelta * 1.5;

  return clamp(speakingRateScore * 0.6 + clamp(lengthScore) * 0.4);
};

export const scoreTone = (metrics: TextMetrics): number => {
  const sentimentBalance = metrics.positiveSentimentCount - metrics.negativeSentimentCount;
  const sentimentScore = 70 + sentimentBalance * 10;

  const fillerImpact = metrics.fillerWordCount > 0 ? 5 : 0;

  return clamp(sentimentScore - fillerImpact);
};

export const scorePersuasiveness = (transcript: string, metrics: TextMetrics): number => {
  const credibilityIndicators = [/team/i, /experience/i, /partners?/i, /awards?/i, /investors?/i];
  const callToActionIndicators = [/join/i, /invest/i, /sign up/i, /contact/i, /schedule/i];

  const credibilityScore = credibilityIndicators.reduce(
    (acc, pattern) => acc + (pattern.test(transcript) ? 10 : 0),
    0,
  );
  const ctaScore = callToActionIndicators.some((pattern) => pattern.test(transcript)) ? 20 : 0;

  const confidenceProxy = 100 - Math.min(metrics.fillerWordCount, 10) * 3;

  return clamp(50 + credibilityScore + ctaScore + confidenceProxy * 0.2);
};

export const computeOverallScore = (scores: Record<string, number>): number => {
  const scoreValues = Object.values(scores);
  if (scoreValues.length === 0) {
    return 0;
  }
  return Math.round(scoreValues.reduce((acc, value) => acc + value, 0) / scoreValues.length);
};

export const estimateSentiment = (metrics: TextMetrics): "positive" | "neutral" | "negative" => {
  if (metrics.positiveSentimentCount > metrics.negativeSentimentCount) {
    return "positive";
  }

  if (metrics.negativeSentimentCount > metrics.positiveSentimentCount) {
    return "negative";
  }

  return "neutral";
};
