import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useState } from 'react';
import { addDaysISO, toISODate } from '../../utils/date';
import { useAppStore } from '../../state/store';
import { IconButton } from '../primitives/IconButton';
import './ItemMenu.css';

type Props = {
  taskId: string;
};

export default function ItemMenu({ taskId }: Props) {
  const task = useAppStore((s) => s.tasks.find((item) => item.id === taskId));
  const expandItem = useAppStore((s) => s.expandItem);
  const addSubtask = useAppStore((s) => s.addSubtask);
  const setLeadTime = useAppStore((s) => s.setLeadTime);
  const planTaskForDate = useAppStore((s) => s.planTaskForDate);
  const changeBucket = useAppStore((s) => s.changeBucket);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-end',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  if (task === undefined) return null;
  const currentTask = task;

  function close() {
    setOpen(false);
  }

  function handleExpand() {
    expandItem(`task:${taskId}`);
    close();
  }

  function handleAddSubtask() {
    addSubtask(taskId, 'New subtask');
    expandItem(`task:${taskId}`);
    close();
  }

  function handlePlanTomorrow() {
    planTaskForDate(taskId, addDaysISO(toISODate(), 1), 'tomorrow', 'tomorrow');
    expandItem(null);
    close();
  }

  function handleLeadTime() {
    setLeadTime(taskId, currentTask.leadTimeMins === undefined ? 30 : undefined);
    close();
  }

  function handleBucket() {
    changeBucket(taskId, currentTask.bucket === 'act' ? 'remember' : 'act');
    close();
  }

  function handleDelete() {
    deleteTask(taskId);
    close();
  }

  return (
    <>
      <IconButton
        ref={refs.setReference}
        label="Open item menu"
        variant="ghost"
        size="sm"
        className="item-menu__trigger"
        aria-expanded={open}
        {...getReferenceProps()}
      >
        <span aria-hidden="true">⋯</span>
      </IconButton>

      {open && (
        <div
          ref={refs.setFloating}
          className="item-menu__popover"
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <button type="button" role="menuitem" onClick={handleExpand}>
            Open details
          </button>
          <button type="button" role="menuitem" onClick={handleAddSubtask}>
            Add subtask
          </button>
          <button type="button" role="menuitem" onClick={handlePlanTomorrow}>
            Move to tomorrow
          </button>
          <button type="button" role="menuitem" onClick={handleLeadTime}>
            {currentTask.leadTimeMins === undefined ? 'Set 30 min lead' : 'Clear lead time'}
          </button>
          <button type="button" role="menuitem" onClick={handleBucket}>
            {currentTask.bucket === 'act' ? 'Move to Remember' : 'Move to Act'}
          </button>
          <button type="button" role="menuitem" className="item-menu__danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </>
  );
}
