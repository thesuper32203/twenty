import { type Task } from '@/activities/types/Task';

export const nextOpenTask = (tasks: Task[]): Task | undefined =>
  tasks
    .filter((task) => task.status !== 'DONE' && task.dueAt !== null)
    .sort((first, second) =>
      (first.dueAt ?? '').localeCompare(second.dueAt ?? ''),
    )[0];
