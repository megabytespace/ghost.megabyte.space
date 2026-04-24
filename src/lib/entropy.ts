import type { EntropySummary, HistoryPoint } from "../types";

export function calculateEntropy(points: HistoryPoint[], windowMinutes: number, bins: number): EntropySummary {
  const values = points.map((point) => point.value);
  const updatedAt = new Date().toISOString();

  if (values.length === 0) {
    return {
      entropyBits: 0,
      sampleCount: 0,
      windowMinutes,
      bins,
      min: 0,
      max: 0,
      mean: 0,
      updatedAt,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  if (min === max) {
    return {
      entropyBits: 0,
      sampleCount: values.length,
      windowMinutes,
      bins,
      min,
      max,
      mean,
      updatedAt,
    };
  }

  const counts = new Array(Math.max(1, bins)).fill(0);
  const span = max - min;

  for (const value of values) {
    const rawIndex = Math.floor(((value - min) / span) * counts.length);
    const index = Math.min(counts.length - 1, Math.max(0, rawIndex));
    counts[index] += 1;
  }

  let entropyBits = 0;

  for (const count of counts) {
    if (count === 0) {
      continue;
    }

    const probability = count / values.length;
    entropyBits -= probability * Math.log2(probability);
  }

  return {
    entropyBits: Number(entropyBits.toFixed(6)),
    sampleCount: values.length,
    windowMinutes,
    bins: counts.length,
    min,
    max,
    mean: Number(mean.toFixed(6)),
    updatedAt,
  };
}
