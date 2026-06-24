import type { TBNode, SecurityFinding, Severity } from '@terrabuilder/engine';

// ─── Security Scorer ─────────────────────────────────────────────────────────
// Calculates security scores from findings.

const SEVERITY_PENALTY: Record<Severity, number> = {
  CRITICAL: 30,
  HIGH: 20,
  MEDIUM: 10,
  LOW: 5,
};

/**
 * Calculate the score for a single node (0-100).
 */
export function calculateNodeScore(findings: SecurityFinding[]): number {
  const total = findings.reduce((acc, f) => acc + SEVERITY_PENALTY[f.severity], 0);
  return Math.max(0, 100 - total);
}

/**
 * Calculate the overall canvas score (weighted average of node scores).
 * Canvas with no nodes returns 100.
 */
export function calculateCanvasScore(nodeScores: Record<string, number>): number {
  const scores = Object.values(nodeScores);
  if (scores.length === 0) return 100;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

/**
 * Determine score color class.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';  // green
  if (score >= 50) return '#f59e0b';  // amber
  return '#ef4444';                    // red
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Secure';
  if (score >= 50) return 'Needs Review';
  return 'Critical Issues';
}

export function getScoreRing(score: number): string {
  if (score >= 80) return 'score-good';
  if (score >= 50) return 'score-warn';
  return 'score-bad';
}

/**
 * Whether the deploy button should be blocked.
 */
export function isDeployBlocked(canvasScore: number): boolean {
  return canvasScore < 60;
}
