import type { TBNode, TBEdge } from './graph.js';

// ─── History Manager ─────────────────────────────────────────────────────────
// Manages undo/redo state using simple snapshot history.
// Maximum 100 history entries.

export interface HistorySnapshot {
  nodes: TBNode[];
  edges: TBEdge[];
  timestamp: number;
}

const MAX_HISTORY = 100;

export class HistoryManager {
  private past: HistorySnapshot[] = [];
  private future: HistorySnapshot[] = [];

  push(snapshot: HistorySnapshot): void {
    this.past.push(snapshot);
    if (this.past.length > MAX_HISTORY) {
      this.past.shift();
    }
    // Clear future on new action
    this.future = [];
  }

  undo(current: HistorySnapshot): HistorySnapshot | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(current);
    return previous;
  }

  redo(current: HistorySnapshot): HistorySnapshot | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    return next;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
