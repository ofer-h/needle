import { describe, expect, it } from 'vitest';
import { createV2Fixture, FIXTURE_IDS, FIXTURE_TODAY } from '../fixture-v2';
import {
  selectActiveFocusItem,
  selectOverdueTasks,
  selectPendingInterventions,
  selectSubtaskProgress,
  selectTodayItems,
  selectTodayTasks,
  selectTodayViewModel,
  selectUpcomingItems,
  selectorStateFromFixture,
} from '../selectors-v2';

describe('selectors-v2 adapter', () => {
  const fixture = createV2Fixture();
  const state = selectorStateFromFixture(fixture);

  it('includes overdue task from yesterday', () => {
    const overdue = selectOverdueTasks(state, FIXTURE_TODAY);
    expect(overdue.some((t) => t.id === FIXTURE_IDS.itemOverdueDana)).toBe(true);
    expect(overdue.every((t) => t.isOverdue === true)).toBe(true);
  });

  it('maps today tasks and calendar events for timeline', () => {
    const today = selectTodayItems(state, FIXTURE_TODAY);
    const labels = today.map((row) => ('label' in row ? row.label : row.title));
    expect(labels).toContain('Daily standup');
    expect(labels).toContain('Manager 1:1');
    expect(labels).toContain('Prep for manager 1:1');
    expect(labels).toContain("Email last week's recap");
  });

  it('orders today items with events at anchor times', () => {
    const today = selectTodayItems(state, FIXTURE_TODAY);
    const standupIdx = today.findIndex(
      (r) => 'label' in r && r.label === 'Daily standup',
    );
    const oneOnOneIdx = today.findIndex(
      (r) => 'label' in r && r.label === 'Manager 1:1',
    );
    expect(standupIdx).toBeGreaterThanOrEqual(0);
    expect(oneOnOneIdx).toBeGreaterThan(standupIdx);
  });

  it('exposes upcoming and unplanned tasks', () => {
    const upcoming = selectUpcomingItems(state, FIXTURE_TODAY);
    expect(upcoming.some((t) => t.title === 'Review PR from Tal')).toBe(true);
    expect(upcoming.some((t) => t.title === 'Book dentist appointment')).toBe(true);
    expect(upcoming.some((t) => t.date === null || t.timeSlot === 'someday')).toBe(true);
  });

  it('counts subtask progress from contains relations', () => {
    const progress = selectSubtaskProgress(state, FIXTURE_IDS.itemTodayPrep);
    expect(progress).toEqual({ done: 0, total: 2 });
  });

  it('lists scheduled interventions for the actor', () => {
    const pending = selectPendingInterventions(state);
    expect(pending.length).toBeGreaterThanOrEqual(3);
    expect(pending.every((i) => i.status === 'scheduled' || i.status === 'active')).toBe(
      true,
    );
  });

  it('resolves active focus item from flow session', () => {
    const focus = selectActiveFocusItem(state);
    expect(focus?.id).toBe(FIXTURE_IDS.itemTodayPrep);
  });

  it('produces Task shape compatible with TodayScreen filters', () => {
    const { tasks, events } = selectTodayViewModel(state, FIXTURE_TODAY);
    const todayTasks = tasks.filter((t) => t.date === FIXTURE_TODAY || (t.isOverdue && !t.done));
    const todayOnly = selectTodayTasks(state, FIXTURE_TODAY);
    expect(todayTasks.length).toBeGreaterThanOrEqual(todayOnly.length);
    expect(events.every((e) => e.date === FIXTURE_TODAY)).toBe(true);
    for (const task of tasks) {
      expect(task).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        scheduleKind: expect.stringMatching(/^(fixed|flexible)$/),
        slotIndex: expect.any(Number),
        slotOrder: expect.any(Number),
      });
    }
  });

  it('maps unmissable meeting commitment on calendar event item', () => {
    const eventItem = fixture.items.find((i) => i.id === FIXTURE_IDS.itemEvent1on1);
    expect(eventItem?.commitmentLevel).toBe('unmissable');
  });
});
