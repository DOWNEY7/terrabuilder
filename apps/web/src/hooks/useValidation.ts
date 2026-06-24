import { useMemo } from 'react';
import {
  validateField,
  validateTerraformIdentifier,
  checkNameCollision,
  type FieldValidationResult,
} from '@terrabuilder/engine';
import { getSchema } from '@terrabuilder/schemas';
import { useCanvasStore } from '../store/canvas';
import type { TBNode } from '@terrabuilder/engine';

// ─── useValidation ────────────────────────────────────────────────────────────
// Per-node validation results for the PropertiesPanel.
// Returns a map of fieldKey → FieldValidationResult for the selected node.

export interface NodeValidation {
  fieldErrors: Record<string, FieldValidationResult>;
  nameResult: FieldValidationResult;
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
}

const ALL_OK: NodeValidation = {
  fieldErrors: {},
  nameResult: { valid: true, severity: 'ok' },
  hasErrors: false,
  hasWarnings: false,
  errorCount: 0,
  warningCount: 0,
};

export function useValidation(node: TBNode | null): NodeValidation {
  const { nodes } = useCanvasStore();

  return useMemo<NodeValidation>(() => {
    if (!node) return ALL_OK;

    const schema = getSchema(node.data.resourceType);
    const fieldErrors: Record<string, FieldValidationResult> = {};

    // ── Validate each schema-defined property ───────────────────────────────
    if (schema) {
      for (const prop of schema.properties) {
        const value = node.data.config[prop.key];
        const result = validateField(
          prop.key,
          value,
          prop.type as any,
          {
            required: prop.required,
            minLength: prop.key === 'bucket' ? 3 : undefined,
            maxLength: prop.key === 'bucket' ? 63 : undefined,
            minValue: prop.minValue,
            maxValue: prop.maxValue,
          }
        );
        if (result.severity !== 'ok') {
          fieldErrors[prop.key] = result;
        }
      }
    }

    // ── Validate display name ───────────────────────────────────────────────
    const nameResult = validateTerraformIdentifier(node.data.displayName);

    // Check for name collision with other nodes
    if (nameResult.valid) {
      const allNodeIds = nodes.map(n => n.id);
      const allNodeNames = nodes.map(n => n.data.displayName);
      const collisionResult = checkNameCollision(
        node.data.displayName,
        node.id,
        allNodeIds,
        allNodeNames
      );
      if (collisionResult.severity !== 'ok') {
        // Merge collision warning into nameResult
        Object.assign(fieldErrors, { _name_collision: collisionResult });
      }
    } else {
      fieldErrors['displayName'] = nameResult;
    }

    // ── Aggregate ──────────────────────────────────────────────────────────
    const allResults = Object.values(fieldErrors);
    const errorCount = allResults.filter(r => r.severity === 'error').length;
    const warningCount = allResults.filter(r => r.severity === 'warning').length;

    return {
      fieldErrors,
      nameResult,
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      errorCount,
      warningCount,
    };
  }, [node, nodes]);
}
