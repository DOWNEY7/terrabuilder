import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager } from '../history.js';
import type { TBNode, TBEdge } from '../graph.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSnapshot(id: string) {
  return {
    nodes: [{ id, type: 'resource' as const, position: { x: 0, y: 0 }, data: {} as any }] as TBNode[],
    edges: [] as TBEdge[],
    timestamp: Date.now(),
  };
}

// ─── HistoryManager ───────────────────────────────────────────────────────────

describe('HistoryManager', () => {
  let history: HistoryManager;

  beforeEach(() => {
    history = new HistoryManager();
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  it('starts with canUndo = false', () => {
    expect(history.canUndo).toBe(false);
  });

  it('starts with canRedo = false', () => {
    expect(history.canRedo).toBe(false);
  });

  // ── Push ────────────────────────────────────────────────────────────────────

  it('after one push, canUndo = true', () => {
    history.push(makeSnapshot('a'));
    expect(history.canUndo).toBe(true);
  });

  it('after one push, canRedo = false', () => {
    history.push(makeSnapshot('a'));
    expect(history.canRedo).toBe(false);
  });

  // ── Undo ────────────────────────────────────────────────────────────────────

  it('undo returns the pushed snapshot', () => {
    const snap = makeSnapshot('a');
    history.push(snap);
    const result = history.undo(makeSnapshot('current'));
    expect(result).not.toBeNull();
    expect(result?.nodes[0]?.id).toBe('a');
  });

  it('undo on empty history returns null', () => {
    expect(history.undo(makeSnapshot('x'))).toBeNull();
  });

  it('after undo, canRedo = true', () => {
    history.push(makeSnapshot('a'));
    history.undo(makeSnapshot('current'));
    expect(history.canRedo).toBe(true);
  });

  it('after undo of the only item, canUndo = false', () => {
    history.push(makeSnapshot('a'));
    history.undo(makeSnapshot('current'));
    expect(history.canUndo).toBe(false);
  });

  // ── Redo ────────────────────────────────────────────────────────────────────

  it('redo returns the state that was current when undo was called', () => {
    history.push(makeSnapshot('a'));         // past=['a']
    const r1 = history.undo(makeSnapshot('b'));  // undo(current='b') → returns 'a', future=['b']
    expect(r1?.nodes[0]?.id).toBe('a');      // sanity check
    const r2 = history.redo(makeSnapshot('b'));  // redo(current='b') → returns 'b' from future
    expect(r2).not.toBeNull();
    expect(r2?.nodes[0]?.id).toBe('b');      // future had 'b'
  });

  it('redo on empty future returns null', () => {
    expect(history.redo(makeSnapshot('x'))).toBeNull();
  });

  it('after redo, canRedo = false (if only one item)', () => {
    history.push(makeSnapshot('a'));
    history.undo(makeSnapshot('b'));
    history.redo(makeSnapshot('b'));
    expect(history.canRedo).toBe(false);
  });

  // ── Push clears redo stack ──────────────────────────────────────────────────

  it('new push clears the redo stack', () => {
    history.push(makeSnapshot('a'));
    history.undo(makeSnapshot('b'));     // builds redo stack
    expect(history.canRedo).toBe(true);
    history.push(makeSnapshot('c'));     // new action — should clear redo
    expect(history.canRedo).toBe(false);
  });

  // ── Multi-step ──────────────────────────────────────────────────────────────

  it('multiple undo steps return in LIFO order', () => {
    history.push(makeSnapshot('step1'));
    history.push(makeSnapshot('step2'));
    history.push(makeSnapshot('step3'));

    const r3 = history.undo(makeSnapshot('current'));
    const r2 = history.undo(makeSnapshot('current'));
    const r1 = history.undo(makeSnapshot('current'));

    expect(r3?.nodes[0]?.id).toBe('step3');
    expect(r2?.nodes[0]?.id).toBe('step2');
    expect(r1?.nodes[0]?.id).toBe('step1');
  });

  it('undo-redo-undo returns to original state', () => {
    const initial = makeSnapshot('initial');
    history.push(initial);

    const afterFirst = makeSnapshot('after-first');
    const r1 = history.undo(afterFirst);
    expect(r1?.nodes[0]?.id).toBe('initial');

    const r2 = history.redo(initial);
    expect(r2?.nodes[0]?.id).toBe('after-first');

    const r3 = history.undo(afterFirst);
    expect(r3?.nodes[0]?.id).toBe('initial');
  });

  // ── Clear ───────────────────────────────────────────────────────────────────

  it('clear resets canUndo and canRedo', () => {
    history.push(makeSnapshot('a'));
    history.clear();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });
});
