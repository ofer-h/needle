import ItemRow from './ItemRow';

type Props = {
  id: string;
  startTime: string;
  label: string;
  sublabel?: string;
};

export default function EventRow({ id, startTime, label, sublabel }: Props) {
  return (
    <ItemRow
      kind="event"
      id={id}
      label={label}
      startTime={startTime}
      {...(sublabel !== undefined ? { sublabel } : {})}
    />
  );
}
