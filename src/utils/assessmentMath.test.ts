import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStudentFinalScore, calculateAssessmentStats } from './assessmentMath';

test('calculateStudentFinalScore averages all TP values correctly', () => {
  const scores = { TP1: 80, TP2: 90, TP3: 70 };
  const result = calculateStudentFinalScore(scores, ['TP1', 'TP2', 'TP3'], 75);
  assert.equal(result.finalScore, 80);
  assert.equal(result.isPassed, true);
});

test('calculateStudentFinalScore marks as not passed when below threshold', () => {
  const scores = { TP1: 60, TP2: 70, TP3: 65 };
  const result = calculateStudentFinalScore(scores, ['TP1', 'TP2', 'TP3'], 75);
  assert.equal(result.finalScore, 65);
  assert.equal(result.isPassed, false);
});

test('calculateAssessmentStats computes class passing rate, average, and identifies hardest TP', () => {
  const students = [
    {
      id: '1',
      no: 1,
      name: 'I Gede Agus Santika',
      tpScores: { TP1: 90, TP2: 85, TP3: 70 },
      finalScore: 81.7,
      isPassed: true,
    },
    {
      id: '2',
      no: 2,
      name: 'Ni Kadek Dwi Aryanti',
      tpScores: { TP1: 80, TP2: 75, TP3: 60 },
      finalScore: 71.7,
      isPassed: false,
    },
    {
      id: '3',
      no: 3,
      name: 'I Komang Raditya',
      tpScores: { TP1: 85, TP2: 80, TP3: 65 },
      finalScore: 76.7,
      isPassed: true,
    },
  ];

  const stats = calculateAssessmentStats(students, ['TP1', 'TP2', 'TP3'], 75);

  assert.equal(stats.totalStudents, 3);
  assert.equal(stats.passedCount, 2);
  assert.equal(stats.remedialCount, 1);
  assert.equal(stats.passingPercentage, 66.7);
  assert.equal(stats.hardestTP, 'TP3');
  assert.equal(stats.easiestTP, 'TP1');
  assert.ok(stats.averageScore > 75);
});
