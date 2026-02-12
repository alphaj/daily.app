import type { Todo } from '@/types/todo';
import type { Habit } from '@/types/habit';
import type { Supplement } from '@/types/supplement';

export interface HomeVariantProps {
  // Date
  selectedDate: Date;
  isToday: boolean;
  isPastDate: boolean;

  // Habits
  habits: Habit[];
  displayHabits: Habit[];
  hasMoreHabits: boolean;
  habitsCompleted: number;
  isCompletedToday: (habit: Habit) => boolean;
  onHabitToggle: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onAddHabit: () => void;
  getWeekDots: (dates: string[]) => boolean[];
  getCompletionRate: (dates: string[]) => number;

  // Supplements
  activeSupplements: Supplement[];
  pillsTaken: number;
  onToggleTaken: (id: string) => void;
  onDeleteSupplement: (id: string) => void;
  onEditSupplement: (supplement: Supplement) => void;
  onAddSupplement: () => void;

  // Tasks
  todosForDate: Todo[];
  allTodos: Todo[];
  tasksCompleted: number;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onReorderTodos: (todos: Todo[]) => void;
  onAddTodo: () => void;
}
