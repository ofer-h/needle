import type { ScheduleKind } from '@needle/domain/types';
import ItemRow from './ItemRow';

type Kind = 'urgent' | 'upcoming' | 'faded';

type Props = {
  id: string;
  scheduleKind: ScheduleKind;
  kind?: Kind;
  label: string;
  sublabel?: string;
  date: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done?: boolean;
  onToggle?: () => void;
};

export default function TaskRow(props: Props) {
  return (
    <ItemRow
      kind="task"
      id={props.id}
      scheduleKind={props.scheduleKind}
      priority={props.kind ?? 'urgent'}
      label={props.label}
      date={props.date}
      done={props.done ?? false}
      {...(props.sublabel !== undefined ? { sublabel: props.sublabel } : {})}
      {...(props.link !== undefined ? { link: props.link } : {})}
      {...(props.datePill !== undefined ? { datePill: props.datePill } : {})}
      {...(props.onToggle !== undefined ? { onToggle: props.onToggle } : {})}
    />
  );
}
