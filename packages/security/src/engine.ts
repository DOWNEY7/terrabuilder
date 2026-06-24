import type { TBNode, TBCanvas, SecurityFinding, SecurityReport } from '@terrabuilder/engine';
import { ALL_RULES, type SecurityRule } from './rules/index.js';
import {
  calculateNodeScore,
  calculateCanvasScore,
  isDeployBlocked,
} from './scorer.js';

// ─── Security Engine ─────────────────────────────────────────────────────────
// Runs all security rules against the canvas and produces a SecurityReport.

export function runSecurityEngine(canvas: TBCanvas): SecurityReport {
  const allFindings: SecurityFinding[] = [];
  const nodeScores: Record<string, number> = {};

  for (const node of canvas.nodes) {
    const nodeFindings = runRulesForNode(node, canvas);
    allFindings.push(...nodeFindings);
    nodeScores[node.id] = calculateNodeScore(nodeFindings);
  }

  const canvasScore = calculateCanvasScore(nodeScores);

  return {
    findings: allFindings,
    nodeScores,
    canvasScore,
    criticalCount: allFindings.filter(f => f.severity === 'CRITICAL').length,
    highCount: allFindings.filter(f => f.severity === 'HIGH').length,
    mediumCount: allFindings.filter(f => f.severity === 'MEDIUM').length,
    lowCount: allFindings.filter(f => f.severity === 'LOW').length,
    deployBlocked: isDeployBlocked(canvasScore),
  };
}

function runRulesForNode(node: TBNode, canvas: TBCanvas): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const rule of ALL_RULES) {
    // Check if rule applies to this node
    const appliesToProvider = rule.clouds.includes(node.data.provider);
    const appliesToType =
      rule.resourceTypes.length === 0 ||
      rule.resourceTypes.includes(node.data.resourceType);

    if (!appliesToProvider || !appliesToType) continue;

    const finding = rule.check(node, canvas);
    if (finding) findings.push(finding);
  }

  return findings;
}

/**
 * Apply an auto-fix for a specific rule+node combination.
 * Returns the updated config or null if no auto-fix available.
 */
export function applyAutoFix(
  nodeId: string,
  ruleId: string,
  canvas: TBCanvas
): Record<string, unknown> | null {
  const node = canvas.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  const rule = ALL_RULES.find(r => r.id === ruleId);
  if (!rule?.autoFix) return null;

  return rule.autoFix(node.data.config);
}

/**
 * Apply all auto-fixes for a node.
 */
export function applyAllAutoFixes(
  nodeId: string,
  canvas: TBCanvas
): Record<string, unknown> | null {
  const node = canvas.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  const findings = runRulesForNode(node, canvas);
  let config = { ...node.data.config };

  for (const finding of findings) {
    if (!finding.autoFixAvailable) continue;
    const rule = ALL_RULES.find(r => r.id === finding.ruleId);
    if (rule?.autoFix) {
      config = rule.autoFix(config);
    }
  }

  return config;
}

/**
 * Apply all auto-fixes for the entire canvas.
 */
export function applyCanvasAutoFixes(canvas: TBCanvas): Map<string, Record<string, unknown>> {
  const fixes = new Map<string, Record<string, unknown>>();
  for (const node of canvas.nodes) {
    const fixed = applyAllAutoFixes(node.id, canvas);
    if (fixed) fixes.set(node.id, fixed);
  }
  return fixes;
}

export { runRulesForNode, ALL_RULES };
