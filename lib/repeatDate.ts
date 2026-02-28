import { addDays, addWeeks, addMonths, getDay } from 'date-fns';
import type { RepeatOption } from '@/types/todo';

/**
 * Given a repeat schedule and a reference date (usually today),
 * returns the next occurrence date as a YYYY-MM-DD string.
 * Returns null for 'none'.
 */
export function getNextRepeatDate(
  repeat: RepeatOption | undefined,
  today: Date,
): string | null {
  if (!repeat || repeat === 'none') return null;

  let next: Date;

  switch (repeat) {
    case 'daily':
      next = addDays(today, 1);
      break;
    case 'weekdays': {
      // 0=Sun, 6=Sat
      const dow = getDay(today);
      if (dow === 5) {
        // Friday → Monday
        next = addDays(today, 3);
      } else if (dow === 6) {
        // Saturday → Monday
        next = addDays(today, 2);
      } else {
        // Sun–Thu → next day
        next = addDays(today, 1);
      }
      break;
    }
    case 'weekly':
      next = addWeeks(today, 1);
      break;
    case 'monthly':
      // date-fns clamps (Jan 31 → Feb 28, etc.)
      next = addMonths(today, 1);
      break;
    default:
      return null;
  }

  return next.toISOString().split('T')[0];
}
