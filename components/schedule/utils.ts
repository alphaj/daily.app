import type { Todo, TimeOfDay } from '@/types/todo';
import {
  HOUR_HEIGHT,
  START_HOUR,
  SNAP_MINUTES,
  SNAP_HEIGHT,
  DEFAULT_DURATION,
  TIME_OF_DAY_DEFAULTS,
  LEFT_GUTTER,
} from './constants';

/** Convert an HH:mm string to a Y position on the grid */
export function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

/** Convert a Y position on the grid to an HH:mm string, snapped to SNAP_MINUTES */
export function yToTime(y: number): string {
  const totalMinutes = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60;
  const snapped = Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Snap a Y value to the nearest grid line */
export function snapY(y: number): number {
  return Math.round(y / SNAP_HEIGHT) * SNAP_HEIGHT;
}

/** Get the effective display time for a todo */
export function getDisplayTime(todo: Todo): string {
  if (todo.dueTime) return todo.dueTime;
  const tod: TimeOfDay = todo.timeOfDay || 'anytime';
  return TIME_OF_DAY_DEFAULTS[tod];
}

/** Get the block height from estimated minutes */
export function getDurationHeight(minutes: number | undefined): number {
  const dur = minutes || DEFAULT_DURATION;
  return (dur / 60) * HOUR_HEIGHT;
}

/** Format HH:mm to display time string like "2:15 PM" */
export function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Format hour number (0-23) to label like "6 AM" */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

// --- Overlap layout algorithm (sweep-line) ---

export interface LayoutBlock {
  todo: Todo;
  top: number;
  height: number;
  left: number;
  width: number;
  column: number;
  totalColumns: number;
}

export function computeOverlapLayout(
  todos: Todo[],
  availableWidth: number,
): LayoutBlock[] {
  if (todos.length === 0) return [];

  // Build intervals
  const intervals = todos.map((todo) => {
    const time = getDisplayTime(todo);
    const top = timeToY(time);
    const height = getDurationHeight(todo.estimatedMinutes);
    return { todo, top, height, bottom: top + height };
  });

  // Sort by top, then by height descending (longer events first)
  intervals.sort((a, b) => a.top - b.top || b.height - a.height);

  // Assign columns using a sweep-line
  const columns: { bottom: number }[] = [];
  const assignments: { column: number; todo: Todo; top: number; height: number }[] = [];

  for (const interval of intervals) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      if (columns[col].bottom <= interval.top) {
        columns[col].bottom = interval.bottom;
        assignments.push({ column: col, todo: interval.todo, top: interval.top, height: interval.height });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push({ bottom: interval.bottom });
      assignments.push({ column: columns.length - 1, todo: interval.todo, top: interval.top, height: interval.height });
    }
  }

  // Group overlapping intervals to find max columns per group
  // We use a connected components approach
  const groups: number[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < assignments.length; i++) {
    if (visited.has(i)) continue;
    const group = [i];
    visited.add(i);
    const stack = [i];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const a = assignments[current];
      for (let j = 0; j < assignments.length; j++) {
        if (visited.has(j)) continue;
        const b = assignments[j];
        // Check overlap
        if (a.top < b.top + b.height && b.top < a.top + a.height) {
          group.push(j);
          visited.add(j);
          stack.push(j);
        }
      }
    }
    groups.push(group);
  }

  const result: LayoutBlock[] = [];

  for (const group of groups) {
    const maxCol = Math.max(...group.map((idx) => assignments[idx].column)) + 1;
    const colWidth = availableWidth / maxCol;

    for (const idx of group) {
      const { column, todo, top, height } = assignments[idx];
      result.push({
        todo,
        top,
        height,
        left: LEFT_GUTTER + column * colWidth,
        width: colWidth,
        column,
        totalColumns: maxCol,
      });
    }
  }

  return result;
}
