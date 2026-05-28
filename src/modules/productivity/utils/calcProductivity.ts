import { ActivityLog } from "../types";

export const calculateProductivity = (logs: ActivityLog[]) => {
  const totalSeconds = logs.reduce(
    (sum, log) => sum + log.duration_seconds,
    0
  );

  const weightedScore = logs.reduce(
    (sum, log) => sum + log.duration_seconds * log.impact_score,
    0
  );

  if (!totalSeconds) {
    return {
      totalMinutes: 0,
      productiveMinutes: 0,
      score: 0,
    };
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round(weightedScore / totalSeconds))
  );

  const productiveMinutes = logs
    .filter((l) => l.impact_score > 0)
    .reduce((sum, l) => sum + l.duration_seconds, 0);

  return {
    totalMinutes: Math.round(totalSeconds / 60),
    productiveMinutes: Math.round(productiveMinutes / 60),
    score,
  };
};
