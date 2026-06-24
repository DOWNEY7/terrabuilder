import { describe, it, expect } from 'vitest';
import { calculateNodeScore, calculateCanvasScore, isDeployBlocked } from '../scorer.js';
import type { SecurityFinding } from '@terrabuilder/engine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFinding(severity: SecurityFinding['severity']): SecurityFinding {
  return {
    ruleId: `TEST-001`,
    nodeId: 'n1',
    severity,
    message: `Test ${severity} finding`,
    autoFixAvailable: false,
  };
}

// ─── calculateNodeScore ───────────────────────────────────────────────────────

describe('calculateNodeScore', () => {
  it('returns 100 with no findings', () => {
    expect(calculateNodeScore([])).toBe(100);
  });

  it('deducts 30 for a CRITICAL finding', () => {
    expect(calculateNodeScore([makeFinding('CRITICAL')])).toBe(70);
  });

  it('deducts 20 for a HIGH finding', () => {
    expect(calculateNodeScore([makeFinding('HIGH')])).toBe(80);
  });

  it('deducts 10 for a MEDIUM finding', () => {
    expect(calculateNodeScore([makeFinding('MEDIUM')])).toBe(90);
  });

  it('deducts 5 for a LOW finding', () => {
    expect(calculateNodeScore([makeFinding('LOW')])).toBe(95);
  });

  it('deducts cumulatively for multiple findings', () => {
    const findings = [makeFinding('CRITICAL'), makeFinding('HIGH'), makeFinding('MEDIUM')];
    expect(calculateNodeScore(findings)).toBe(100 - 30 - 20 - 10);
  });

  it('score never goes below 0 with many CRITICAL findings', () => {
    const findings = Array.from({ length: 10 }, () => makeFinding('CRITICAL'));
    expect(calculateNodeScore(findings)).toBe(0);
  });

  it('score is always an integer or zero', () => {
    const score = calculateNodeScore([makeFinding('HIGH'), makeFinding('MEDIUM')]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── calculateCanvasScore ─────────────────────────────────────────────────────

describe('calculateCanvasScore', () => {
  it('returns 100 for empty node scores', () => {
    expect(calculateCanvasScore({})).toBe(100);
  });

  it('returns the single score when only one node', () => {
    expect(calculateCanvasScore({ n1: 70 })).toBe(70);
  });

  it('returns the average of node scores', () => {
    expect(calculateCanvasScore({ n1: 100, n2: 60 })).toBe(80);
  });

  it('rounds the result', () => {
    const score = calculateCanvasScore({ n1: 100, n2: 70, n3: 50 });
    // (100+70+50)/3 = 73.33... → 73
    expect(score).toBe(73);
  });

  it('handles all-zero scores', () => {
    expect(calculateCanvasScore({ n1: 0, n2: 0, n3: 0 })).toBe(0);
  });

  it('handles all-100 scores', () => {
    expect(calculateCanvasScore({ n1: 100, n2: 100, n3: 100 })).toBe(100);
  });
});

// ─── isDeployBlocked ──────────────────────────────────────────────────────────

describe('isDeployBlocked', () => {
  it('is NOT blocked at score 100', () => {
    expect(isDeployBlocked(100)).toBe(false);
  });

  it('is NOT blocked at score 60', () => {
    expect(isDeployBlocked(60)).toBe(false);
  });

  it('IS blocked at score 59', () => {
    expect(isDeployBlocked(59)).toBe(true);
  });

  it('IS blocked at score 0', () => {
    expect(isDeployBlocked(0)).toBe(true);
  });

  it('threshold is exactly 60 (not blocked)', () => {
    expect(isDeployBlocked(60)).toBe(false);
  });

  it('threshold is exactly 59 (blocked)', () => {
    expect(isDeployBlocked(59)).toBe(true);
  });
});
