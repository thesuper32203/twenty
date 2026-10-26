import { nextOpenTask } from '@/object-record/record-board/record-board-card/utils/nextOpenTask';
import { type Task } from '@/activities/types/Task';

describe('nextOpenTask', () => {
  it('chooses the earliest due incomplete task', () => {
    const tasks = [
      { id: 'late', status: 'TODO', dueAt: '2026-11-02T12:00:00Z' },
      { id: 'done', status: 'DONE', dueAt: '2026-10-23T12:00:00Z' },
      { id: 'next', status: 'IN_PROGRESS', dueAt: '2026-10-24T12:00:00Z' },
      { id: 'unscheduled', status: 'TODO', dueAt: null },
    ] as Task[];

    expect(nextOpenTask(tasks)?.id).toBe('next');
  });
});
