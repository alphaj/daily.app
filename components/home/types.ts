import type { Todo, TimeOfDay } from '@/types/todo';

export interface HomeVariantProps {
  // Date
  selectedDate: Date;
  isToday: boolean;
  isPastDate: boolean;

  // Tasks
  todosForDate: Todo[];
  allTodos: Todo[];
  tasksCompleted: number;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onReorderTodos: (todos: Todo[]) => void;
  onAddTodo: () => void;
  onAddTodoForSection?: (timeOfDay: TimeOfDay) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  onEditSubtask?: (todoId: string, subtaskId: string, newTitle: string) => void;
  onConvertSubtaskToTask?: (todoId: string, subtaskId: string) => void;
  onDuplicateTodo?: (id: string) => void;
  onRescheduleTodo?: (id: string, date: string) => void;
  onEditTodo?: (todo: Todo) => void;
}
