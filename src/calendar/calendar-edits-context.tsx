import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { BlockedSlot } from "@/calendar/calendar-data";

/**
 * Live, in-memory edits the pro has made on the Calendar surface.
 * State is a single snapshot { blocks, bufferExtensions } so undo/redo
 * works as one consistent timeline across both editable surfaces.
 *
 * Persistence is intentionally session-scoped for now. A future Lovable
 * Cloud migration writes through to `availability_blocks` / a new
 * `blocked_time` table; the API surface here is shaped to match.
 */

export type BlockEdit = BlockedSlot;

interface EditsSnapshot {
  blocks: BlockEdit[];
  bufferExtensions: Record<string, number>;
}

const EMPTY: EditsSnapshot = { blocks: [], bufferExtensions: {} };

interface CalendarEditsCtx {
  blocks: BlockEdit[];
  addBlock: (b: BlockEdit) => void;
  updateBlock: (id: string, next: Partial<BlockEdit>) => void;
  removeBlock: (id: string) => void;

  bufferExtensions: Record<string, number>;
  setBufferExtension: (bufferId: string, extraMin: number) => void;

  // Undo / redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /** Bumps on every commit / undo / redo. Lets the undo bubble reset its
   *  auto-dismiss timer whenever a new edit happens. */
  version: number;
}

const Ctx = createContext<CalendarEditsCtx | null>(null);

export function CalendarEditsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<EditsSnapshot>(EMPTY);
  const pastRef = useRef<EditsSnapshot[]>([]);
  const futureRef = useRef<EditsSnapshot[]>([]);
  // Bump to force re-render when only the history stacks change.
  const [, setHistoryTick] = useState(0);
  const bumpHistory = useCallback(() => setHistoryTick((n) => n + 1), []);

  const commit = useCallback(
    (next: EditsSnapshot) => {
      pastRef.current = [...pastRef.current, snapshot].slice(-50);
      futureRef.current = [];
      setSnapshot(next);
      bumpHistory();
      setVersion((v) => v + 1);
    },
    [snapshot, bumpHistory],
  );

  const addBlock = useCallback(
    (b: BlockEdit) => commit({ ...snapshot, blocks: [...snapshot.blocks, b] }),
    [snapshot, commit],
  );

  const updateBlock = useCallback(
    (id: string, next: Partial<BlockEdit>) =>
      commit({
        ...snapshot,
        blocks: snapshot.blocks.map((b) => (b.id === id ? { ...b, ...next } : b)),
      }),
    [snapshot, commit],
  );

  const removeBlock = useCallback(
    (id: string) =>
      commit({
        ...snapshot,
        blocks: snapshot.blocks.filter((b) => b.id !== id),
      }),
    [snapshot, commit],
  );

  const setBufferExtension = useCallback(
    (bufferId: string, extraMin: number) =>
      commit({
        ...snapshot,
        bufferExtensions: {
          ...snapshot.bufferExtensions,
          [bufferId]: Math.max(0, extraMin),
        },
      }),
    [snapshot, commit],
  );

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [snapshot, ...futureRef.current].slice(0, 50);
    setSnapshot(prev);
    bumpHistory();
  }, [snapshot, bumpHistory]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;
    const next = future[0];
    futureRef.current = future.slice(1);
    pastRef.current = [...pastRef.current, snapshot].slice(-50);
    setSnapshot(next);
    bumpHistory();
  }, [snapshot, bumpHistory]);

  const [version, setVersion] = useState(0);
  // Bump version on every commit / undo / redo so the UndoRedo bubble can
  // reset its auto-dismiss timer when fresh edits land.
  // (We piggyback on the existing bumpHistory call sites.)
  // We do this by wrapping bumpHistory to also increment version.
  const bumpHistoryAndVersion = useCallback(() => {
    bumpHistory();
    setVersion((v) => v + 1);
  }, [bumpHistory]);

  const value = useMemo<CalendarEditsCtx>(
    () => ({
      blocks: snapshot.blocks,
      bufferExtensions: snapshot.bufferExtensions,
      addBlock,
      updateBlock,
      removeBlock,
      setBufferExtension,
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
      undo: () => {
        undo();
        bumpHistoryAndVersion();
      },
      redo: () => {
        redo();
        bumpHistoryAndVersion();
      },
      version,
    }),
    [snapshot, addBlock, updateBlock, removeBlock, setBufferExtension, undo, redo, version, bumpHistoryAndVersion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCalendarEdits(): CalendarEditsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      blocks: [],
      addBlock: () => {},
      updateBlock: () => {},
      removeBlock: () => {},
      bufferExtensions: {},
      setBufferExtension: () => {},
      canUndo: false,
      canRedo: false,
      undo: () => {},
      redo: () => {},
      version: 0,
    };
  }
  return ctx;
}
