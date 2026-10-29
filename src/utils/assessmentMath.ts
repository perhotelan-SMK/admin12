import { StudentScore } from '../types';

export interface AssessmentStats {
  totalStudents: number;
  passedCount: number;
  remedialCount: number;
  passingPercentage: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  tpAverages: Record<string, number>;
  hardestTP: string | null;
  easiestTP: string | null;
}

/**
 * Calculates final score and pass/fail status for a single student based on their TP scores
 */
export function calculateStudentFinalScore(
  tpScores: Record<string, number>,
  tpKeys: string[],
  passingThreshold = 75
): { finalScore: number; isPassed: boolean } {
  if (!tpKeys || tpKeys.length === 0) {
    return { finalScore: 0, isPassed: false };
  }

  let total = 0;
  let count = 0;

  for (const key of tpKeys) {
    const val = Number(tpScores[key] ?? 0);
    total += isNaN(val) ? 0 : val;
    count++;
  }

  const finalScore = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
  return {
    finalScore,
    isPassed: finalScore >= passingThreshold,
  };
}

/**
 * Calculates classroom aggregate statistics, identifying hardest TPs and remedial needs
 */
export function calculateAssessmentStats(
  students: StudentScore[],
  tpKeys: string[],
  passingThreshold = 75
): AssessmentStats {
  if (!students || students.length === 0) {
    return {
      totalStudents: 0,
      passedCount: 0,
      remedialCount: 0,
      passingPercentage: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      tpAverages: {},
      hardestTP: null,
      easiestTP: null,
    };
  }

  let totalScoreSum = 0;
  let passedCount = 0;
  let highestScore = -Infinity;
  let lowestScore = Infinity;

  const tpSums: Record<string, number> = {};
  const tpCounts: Record<string, number> = {};

  tpKeys.forEach((key) => {
    tpSums[key] = 0;
    tpCounts[key] = 0;
  });

  students.forEach((student) => {
    const score = student.finalScore;
    totalScoreSum += score;
    if (score >= passingThreshold) {
      passedCount++;
    }
    if (score > highestScore) highestScore = score;
    if (score < lowestScore) lowestScore = score;

    tpKeys.forEach((key) => {
      const val = Number(student.tpScores?.[key] ?? 0);
      if (!isNaN(val)) {
        tpSums[key] += val;
        tpCounts[key] += 1;
      }
    });
  });

  const tpAverages: Record<string, number> = {};
  let minAvg = Infinity;
  let maxAvg = -Infinity;
  let hardestTP: string | null = null;
  let easiestTP: string | null = null;

  tpKeys.forEach((key) => {
    const count = tpCounts[key] || 1;
    const avg = Math.round((tpSums[key] / count) * 10) / 10;
    tpAverages[key] = avg;

    if (avg < minAvg) {
      minAvg = avg;
      hardestTP = key;
    }
    if (avg > maxAvg) {
      maxAvg = avg;
      easiestTP = key;
    }
  });

  const totalStudents = students.length;
  const remedialCount = totalStudents - passedCount;
  const passingPercentage = Math.round((passedCount / totalStudents) * 1000) / 10;
  const averageScore = Math.round((totalScoreSum / totalStudents) * 10) / 10;

  return {
    totalStudents,
    passedCount,
    remedialCount,
    passingPercentage,
    averageScore,
    highestScore: highestScore === -Infinity ? 0 : highestScore,
    lowestScore: lowestScore === Infinity ? 0 : lowestScore,
    tpAverages,
    hardestTP,
    easiestTP,
  };
}
